const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const persons = require('./modules/models/persons');
const transactions = require('./modules/models/transactions'); // Assuming you have a Mongoose model for transactions
const creditdebits = require('./modules/models/transactions');
require('./modules/models/dbconnect/dbconnect');

// Enable CORS
app.use(cors());
// Parse JSON bodies
app.use(bodyParser.json());

// Endpoint to fetch data
app.get('/app', async (req, res) => {
    console.log("called")
    try {
        const result = await persons.aggregate([
            {
                $lookup: {
                    from: 'creditdebits',
                    localField: '_id',
                    foreignField: 'personid',
                    as: 'transactions'
                }
            }
        ]).exec();
        console.log(result);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/transactions/:personsId', async(req, res)=>{
    try {
        const{ personsId }= req.params
        console.log(req.params.personsId)
        const result = await transactions.find({personid: personsId})
        console.log(result)
        res.json(result);
    } catch (error) {
        console.log(error)
    }
})

// Endpoint to add a new person
app.post('/addperson', async (req, res) => {
    try {
        // Extract person's name and mobile number from the request body
        const { name, mobileNumber } = req.body;

        // Validate input (ensure name is not empty)
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        // Create a new person instance
        const newPerson = new persons({
            name: name,
            mobilenumber: mobileNumber
        });

        // Save the new person to the database
        await newPerson.save();

        // Respond with success message
        res.status(201).json({ message: 'Person added successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error adding person:', error);
        res.status(500).json({ error: 'Failed to add person' });
    }
});

// Endpoint to add a new transaction
app.post('/addtransaction', async(req, res) => {
    try {
        // Extract transaction data from the request body
        const { personId, amount, date, time, remarks, items, transactiontype } = req.body;
        console.log(req.body)

        console.log('Received Person ID:', personId);

        // Create a new transaction instance
        const newTransaction = new creditdebits({
            personid: personId,
            amount: amount,
            date: date,
            time: time,
            detail: remarks,
            transactiontype: transactiontype,
            items: items
        });

        // Save the new transaction to the database
        await newTransaction.save();

        // Respond with success message
        res.status(201).json({ message: 'Transaction added successfully' });
    } catch (error) {
        // Handle errors
        console.error('Error adding transaction:', error);
        res.status(500).json({ error: 'Failed to add transaction' });
    }
});


// Define the route for updating a transaction
app.post('/updatetransaction/:entryId', async (req, res) => {
    // Extract entryId from request parameters
    const { entryId } = req.params;

    try {
        // Retrieve transaction data from the request body
        const { amount, date, time, remarks, transactiontype, items } = req.body;

        // Perform the update operation using findOneAndUpdate
        const resp = await creditdebits.findOneAndUpdate(
            { _id: entryId }, // Query to find the document with the specified entryId
            { $set: { amount, date, time, remarks, transactiontype, items } }, // Update fields with the provided values
            { new: true } // Return the updated document
        );

        // Log the updated document
        console.log(`Updated transaction:`, resp);

        // Send a response indicating the update was successful
        res.status(200).json({ message: 'Transaction updated successfully', updatedTransaction: resp });
    } catch (error) {
        // If an error occurs during the update process, send an error response
        console.error('Error updating transaction:', error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

app.delete('/delentry/:entryId', async (req, res) => {
    try {
        const entryId = req.params.entryId;
        // Check if the entry exists
        const entry = await creditdebits.findByIdAndDelete(entryId);
        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }
        // Delete the entry
        // await entry.delete();
        // Respond with success message
        res.status(200).json({ message: 'Entry deleted successfully' });
    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: 'Failed to delete entry' });
    }
});

// Endpoint to convert transaction type
app.put('/convertTransactionType/:entryId', async (req, res) => {
    // Extract entryId from request parameters
    const { entryId } = req.params;

    try {
        // Retrieve transaction type from the request body
        const { transactiontype } = req.body;

        // Perform the update operation using findOneAndUpdate
        const resp = await creditdebits.findOneAndUpdate(
            { _id: entryId }, // Query to find the document with the specified entryId
            { $set: { transactiontype } }, // Update transaction type with the provided value
            { new: true } // Return the updated document
        );

        // Log the updated document
        console.log(`Converted transaction type:`, resp);

        // Send a response indicating the update was successful
        res.status(200).json({ message: 'Transaction type converted successfully', updatedTransaction: resp });
    } catch (error) {
        // If an error occurs during the update process, send an error response
        console.error('Error converting transaction type:', error);
        res.status(500).json({ error: 'Failed to convert transaction type' });
    }
});

app.listen(3001, () => {
    console.log(`port 3001 listening`);
});
