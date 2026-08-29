import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import Customer from '../models/Customer.js';

const router = express.Router();

// GET all customers with pagination, search, and filters
router.get('/', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database disconnected. Check IP whitelist.' });
  }
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const category = req.query.category as string; // Can be a string or array
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string) === 'asc' ? 1 : -1;
    
    // Filters
    const minPrice = parseFloat(req.query.minPrice as string);
    const maxPrice = parseFloat(req.query.maxPrice as string);
    const fromDate = req.query.fromDate as string;
    const toDate = req.query.toDate as string;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      const categories = Array.isArray(category) ? category : category.split(',');
      query.categories = { $in: categories };
    }
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      query.price = {};
      if (!isNaN(minPrice)) query.price.$gte = minPrice;
      if (!isNaN(maxPrice)) query.price.$lte = maxPrice;
    }
    if (fromDate || toDate) {
      query.lastPurchaseDate = {};
      if (fromDate) query.lastPurchaseDate.$gte = new Date(fromDate);
      if (toDate) query.lastPurchaseDate.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Customer.find(query)
        .sort({ [sortBy]: sortOrder as any })
        .skip(skip)
        .limit(limit),
      Customer.countDocuments(query),
    ]);

    res.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch customers',
      error: error.message,
    });
  }
});

// GET dashboard stats
router.get('/stats', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database disconnected.' });
  }
  try {
    const now = new Date();
    const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [totalCustomers, totalPurchaseValue, totalRewards, totalRedeemed, categoryStats, revenueData, customersThisMonth, customersLastMonth] = await Promise.all([
      Customer.countDocuments(),
      Customer.aggregate([{ $group: { _id: null, total: { $sum: '$price' } } }]),
      Customer.aggregate([{ $group: { _id: null, total: { $sum: '$rewards' } } }]),
      Customer.aggregate([{ $group: { _id: null, total: { $sum: '$redeemedRewards' } } }]),
      Customer.aggregate([
        { $unwind: '$categories' },
        { $group: { _id: '$categories', count: { $sum: 1 } } },
      ]),
      Customer.aggregate([
        { $unwind: '$purchaseHistory' },
        {
          $group: {
            _id: {
              year: { $year: { date: '$purchaseHistory.date', timezone: 'Asia/Kolkata' } },
              month: { $month: { date: '$purchaseHistory.date', timezone: 'Asia/Kolkata' } },
              day: { $dayOfMonth: { date: '$purchaseHistory.date', timezone: 'Asia/Kolkata' } },
            },
            revenue: { $sum: '$purchaseHistory.amount' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      Customer.countDocuments({ createdAt: { $gte: firstDayThisMonth } }),
      Customer.countDocuments({ createdAt: { $gte: firstDayLastMonth, $lte: lastDayLastMonth } })
    ]);

    let customerGrowth = 0;
    if (customersLastMonth > 0) {
      customerGrowth = ((customersThisMonth - customersLastMonth) / customersLastMonth) * 100;
    } else if (customersThisMonth > 0) {
      customerGrowth = 100;
    }

    const tr = totalRewards[0]?.total || 0;
    const tred = totalRedeemed[0]?.total || 0;
    let rewardsRedeemedPercentage = 0;
    if (tr + tred > 0) {
      rewardsRedeemedPercentage = (tred / (tr + tred)) * 100;
    }

    const stats = {
      totalCustomers,
      totalPurchaseValue: totalPurchaseValue[0]?.total || 0,
      totalRewards: tr,
      categories: categoryStats.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      revenueData: revenueData.map(d => ({
        date: `${d._id.year}-${String(d._id.month).padStart(2, '0')}-${String(d._id.day).padStart(2, '0')}`,
        revenue: d.revenue
      })),
      customerGrowth,
      rewardsRedeemedPercentage
    };

    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch stats',
      error: error.message,
    });
  }
});


// RECALCULATE ALL POINTS
router.post('/recalculate-points', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database disconnected.' });
  }
  try {
    const { minAmount, incrementAmount, pointsPerIncrement } = req.body;
    
    if (minAmount == null || incrementAmount == null || pointsPerIncrement == null) {
       return res.status(400).json({ success: false, message: 'Missing settings' });
    }

    const customers = await Customer.find({});
    
    for (const customer of customers) {
      let totalRewards = 0;
      
      // We can either recalculate based on total price, or per-purchase.
      // Usually, it's based on total price. But the previous logic calculated per-purchase!
      // Let's recalculate based on total price to be safe, or iterate purchaseHistory.
      // The requirement says "change the points and update... reflecting in customer directory"
      
      // Recalculating per purchase history:
      for (const purchase of customer.purchaseHistory) {
        if (purchase.amount >= minAmount) {
          const increments = Math.floor((purchase.amount - minAmount) / incrementAmount);
          const earned = (1 + increments) * pointsPerIncrement;
          purchase.rewardsEarned = earned;
          totalRewards += earned;
        } else {
          purchase.rewardsEarned = 0;
        }
      }
      
      customer.rewards = totalRewards;
      await customer.save();
    }

    res.json({ success: true, message: 'Recalculated all customer points successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to recalculate points', error: error.message });
  }
});

// GET single customer
router.get('/:id', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database disconnected.' });
  }
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({ success: true, data: customer });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to fetch customer',
      error: error.message,
    });
  }
});

// CREATE customer
router.post('/', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ 
      success: false,
      message: 'Database is currently disconnected. If you are using MongoDB Atlas, ensure your IP is whitelisted (0.0.0.0/0).',
    });
  }
  
  try {
    const { name, phoneNumber, lastPurchaseDate, categories, price, rewards } = req.body;
    
    // Check for existing phone number
    const existingCustomer = await Customer.findOne({ phoneNumber });
    if (existingCustomer) {
      return res.status(400).json({ 
        success: false, 
        message: 'A customer with this phone number already exists.' 
      });
    }

    const customer = new Customer({
      name,
      phoneNumber,
      lastPurchaseDate: new Date(lastPurchaseDate || Date.now()),
      categories,
      price: Number(price) || 0,
      rewards: Number(rewards) || 0,
      visits: 1,
      purchaseHistory: [{
        date: new Date(lastPurchaseDate || Date.now()),
        amount: Number(price) || 0,
        categories,
        rewardsEarned: Number(rewards) || 0,
      }]
    });
    
    await customer.save();
    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Unable to create customer',
      error: error.message,
    });
  }
});

// ADD PURCHASE to existing customer
router.post('/:id/purchases', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database disconnected.' });
  }
  try {
    const { amount, categories, rewardsEarned, date } = req.body;
    
    const purchaseDate = date ? new Date(date) : new Date();
    const purchaseAmount = Number(amount) || 0;
    const earned = Number(rewardsEarned) || 0;

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    customer.purchaseHistory.push({
      date: purchaseDate,
      amount: purchaseAmount,
      categories: categories || [],
      rewardsEarned: earned
    });

    customer.price += purchaseAmount;
    customer.rewards += earned;
    customer.visits += 1;
    customer.lastPurchaseDate = purchaseDate;
    
    // Add new categories if not present
    if (categories && Array.isArray(categories)) {
      categories.forEach(c => {
        if (!customer.categories.includes(c)) {
          customer.categories.push(c);
        }
      });
    }

    await customer.save();

    res.json({
      success: true,
      message: 'Purchase added successfully',
      data: customer,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Unable to add purchase',
      error: error.message,
    });
  }
});

// UPDATE customer
router.put('/:id', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database disconnected.' });
  }
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: 'Unable to update customer',
      error: error.message,
    });
  }
});

// DELETE customer
router.delete('/:id', async (req: Request, res: Response) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: 'Database disconnected.' });
  }
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Unable to delete customer',
      error: error.message,
    });
  }
});

export default router;
