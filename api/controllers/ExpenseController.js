module.exports = {
    /**
     * `ExpenseController.create()`
     * Creates a new expense
     */
    create: async function (req, res) {
        try {
            const {
                description,
                amount,
                date,
                category,
                notes
            } = req.body;

            // Validate required fields
            if (!description || !amount || !category) {
                return res.status(400).json({
                    status: 'error',
                    error: sails.config.responses.AUTH.REQUIRED_FIELDS_MISSING
                });
            }

            // Validate amount is a positive number
            if (typeof amount !== 'number' || amount <= 0) {
                return res.status(400).json({
                    status: 'error',
                    error: {
                        code: 'EXPENSE_001',
                        message: 'Amount must be a positive number'
                    }
                });
            }

            // Validate category (optional validation for predefined categories)
            const validCategories = ['rent', 'utilities', 'supplies', 'equipment', 'salary', 'maintenance', 'other'];
            if (category && !validCategories.includes(category.toLowerCase())) {
                return res.status(400).json({
                    status: 'error',
                    error: {
                        code: 'EXPENSE_002',
                        message: 'Invalid category. Must be one of: ' + validCategories.join(', ')
                    }
                });
            }

            // Generate expense number
            const currentDate = new Date();
            const year = currentDate.getFullYear();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const count = await Expense.count({
                location: req.user.location,
                organization: req.user.organization,
            });
            const expenseNumber = `EXP-${year}${month}-${String(count + 1).padStart(4, '0')}`;

            // Create expense record
            const newExpense = await Expense.create({
                expenseNumber,
                description,
                amount,
                date: date || Date.now(),
                category: category.toLowerCase(),
                notes: notes || '',
                organization: req.user.organization,
                location: req.user.location,
                addedBy: req.user.id
            }).fetch();

            newExpense.addedBy = req.user;

            return res.status(201).json({
                status: 'success',
                message: 'Expense created successfully',
                data: newExpense
            });

        } catch (err) {
            sails.log.error('Error creating expense:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ExpenseController.find()`
     * Get all expenses for the current user's location/organization
     */
    find: async function (req, res) {
        try {
            if (!req.user || !req.user.location) {
                return res.status(400).json({
                    status: 'error',
                    error: 'User location is not available'
                });
            }

            const { category, startDate, endDate, page = 1, limit = 10 } = req.query;

            const findCriteria = {
                location: req.user.location,
                organization: req.user.organization,
                deletedAt: 0
            };

            // Filter by category if provided
            if (category) {
                findCriteria.category = category.toLowerCase();
            }

            // Filter by date range if provided
            if (startDate || endDate) {
                findCriteria.date = {};
                if (startDate) {
                    findCriteria.date['>='] = new Date(startDate).getTime();
                }
                if (endDate) {
                    findCriteria.date['<='] = new Date(endDate).getTime();
                }
            }

            // Calculate pagination
            // const skip = (parseInt(page) - 1) * parseInt(limit);

            const [expenses, totalCount] = await Promise.all([
                Expense.find(findCriteria)
                    .populate('addedBy')
                    .sort('date DESC'),
                Expense.count(findCriteria)
            ]);

            // Calculate total amount for current filter
            const totalAmount = await Expense.sum('amount', findCriteria);

            return res.json({
                status: 'success',
                data: {
                    expenses,
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: totalCount,
                        pages: Math.ceil(totalCount / parseInt(limit))
                    },
                    summary: {
                        totalAmount: totalAmount || 0,
                        count: totalCount
                    }
                }
            });

        } catch (err) {
            sails.log.error('Error fetching expenses:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ExpenseController.findOne()`
     * Get a specific expense
     */
    findOne: async function (req, res) {
        try {
            const { id } = req.params;

            if (!req.user || !req.user.location) {
                return res.status(400).json({
                    status: 'error',
                    error: 'User location is not available'
                });
            }

            const expense = await Expense.findOne({
                id,
                location: req.user.location,
                organization: req.user.organization,
            }).populate('addedBy', ['firstName', 'lastName', 'email']);

            if (!expense) {
                return res.status(404).json({
                    status: 'error',
                    error: sails.config.responses.GENERIC.NOT_FOUND
                });
            }

            return res.json({
                status: 'success',
                data: expense
            });

        } catch (err) {
            sails.log.error('Error fetching expense:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ExpenseController.update()`
     * Update an existing expense
     */
    update: async function (req, res) {
        try {
            const { id } = req.params;
            const {
                description,
                amount,
                date,
                category,
                notes
            } = req.body;

            if (!req.user || !req.user.location) {
                return res.status(400).json({
                    status: 'error',
                    error: 'User location is not available'
                });
            }

            const expense = await Expense.findOne({
                id,
                location: req.user.location,
                organization: req.user.organization,
            }).populate('addedBy');

            if (!expense) {
                return res.status(404).json({
                    status: 'error',
                    error: sails.config.responses.GENERIC.NOT_FOUND
                });
            }

            // Validate amount if provided
            if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
                return res.status(400).json({
                    status: 'error',
                    error: {
                        code: 'EXPENSE_001',
                        message: 'Amount must be a positive number'
                    }
                });
            }

            // Validate category if provided
            if (category) {
                const validCategories = ['rent', 'utilities', 'supplies', 'equipment', 'salary', 'maintenance', 'other'];
                if (!validCategories.includes(category.toLowerCase())) {
                    return res.status(400).json({
                        status: 'error',
                        error: {
                            code: 'EXPENSE_002',
                            message: 'Invalid category. Must be one of: ' + validCategories.join(', ')
                        }
                    });
                }
            }

            // Build update object with only provided fields
            const updateData = {};
            if (description !== undefined) updateData.description = description;
            if (amount !== undefined) updateData.amount = amount;
            if (date !== undefined) updateData.date = new Date(date).getTime();
            if (category !== undefined) updateData.category = category.toLowerCase();
            if (notes !== undefined) updateData.notes = notes;

            const updatedExpense = await Expense.updateOne({ id }).set(updateData);
            updatedExpense.addedBy = expense.addedBy;

            return res.json({
                status: 'success',
                message: 'Expense updated successfully',
                data: updatedExpense
            });

        } catch (err) {
            sails.log.error('Error updating expense:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ExpenseController.delete()`
     * Delete an expense
     */
    delete: async function (req, res) {
        try {
            const { id } = req.params;

            if (!req.user || !req.user.location) {
                return res.status(400).json({
                    status: 'error',
                    error: 'User location is not available'
                });
            }

            const expense = await Expense.findOne({
                id,
                location: req.user.location,
                organization: req.user.organization,
            });

            if (!expense) {
                return res.status(404).json({
                    status: 'error',
                    error: sails.config.responses.GENERIC.NOT_FOUND
                });
            }

            // Soft delete the expense
            await Expense.updateOne({ id }).set({ deletedAt: Date.now() });

            return res.json({
                status: 'success',
                message: 'Expense deleted successfully'
            });

        } catch (err) {
            sails.log.error('Error deleting expense:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    },

    /**
     * `ExpenseController.summary()`
     * Get expense summary by category and date range
     */
    summary: async function (req, res) {
        try {
            if (!req.user || !req.user.location) {
                return res.status(400).json({
                    status: 'error',
                    error: 'User location is not available'
                });
            }

            const { startDate, endDate } = req.query;

            const baseCriteria = {
                location: req.user.location,
                organization: req.user.organization,
                deletedAt: 0
            };

            // Calculate date ranges
            const now = new Date();
            const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).getTime();

            // Get data for different time periods
            const [
                totalExpenses,
                totalAmount,
                yearExpenses,
                yearAmount,
                monthExpenses,
                monthAmount,
                weekExpenses,
                weekAmount,
                allExpenses
            ] = await Promise.all([
                // Total (all time)
                Expense.count(baseCriteria),
                Expense.sum('amount', baseCriteria),
                
                // This Year
                Expense.count({ ...baseCriteria, date: { '>=': startOfYear } }),
                Expense.sum('amount', { ...baseCriteria, date: { '>=': startOfYear } }),
                
                // This Month
                Expense.count({ ...baseCriteria, date: { '>=': startOfMonth } }),
                Expense.sum('amount', { ...baseCriteria, date: { '>=': startOfMonth } }),
                
                // This Week
                Expense.count({ ...baseCriteria, date: { '>=': startOfWeek } }),
                Expense.sum('amount', { ...baseCriteria, date: { '>=': startOfWeek } }),
                
                // All expenses for category breakdown (apply custom date range if provided)
                Expense.find({
                    ...baseCriteria,
                    ...(startDate || endDate ? {
                        date: {
                            ...(startDate ? { '>=': new Date(startDate).getTime() } : {}),
                            ...(endDate ? { '<=': new Date(endDate).getTime() } : {})
                        }
                    } : {})
                })
            ]);

            // Group by category for the custom date range or all expenses
            const categoryBreakdown = allExpenses.reduce((acc, expense) => {
                const category = expense.category;
                if (!acc[category]) {
                    acc[category] = {
                        category,
                        totalAmount: 0,
                        count: 0
                    };
                }
                acc[category].totalAmount += expense.amount;
                acc[category].count += 1;
                return acc;
            }, {});

            return res.json({
                status: 'success',
                data: {
                    timePeriods: {
                        total: {
                            amount: totalAmount || 0,
                            count: totalExpenses
                        },
                        thisYear: {
                            amount: yearAmount || 0,
                            count: yearExpenses
                        },
                        thisMonth: {
                            amount: monthAmount || 0,
                            count: monthExpenses
                        },
                        thisWeek: {
                            amount: weekAmount || 0,
                            count: weekExpenses
                        }
                    },
                    byCategory: Object.values(categoryBreakdown),
                    dateRange: {
                        startDate: startDate || null,
                        endDate: endDate || null
                    }
                }
            });

        } catch (err) {
            sails.log.error('Error generating expense summary:', err);
            return res.status(500).json({
                status: 'error',
                error: sails.config.responses.GENERIC.SERVER_ERROR
            });
        }
    }
}; 