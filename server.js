const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const moment = require('moment');



const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

mongoose.connect('mongodb://localhost:27017/employee_rating', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const ratingSchema = new mongoose.Schema({
  employeeName: String,
  appearanceRating: Number,
  packingRating: Number,
  truckRating: Number,
  comments: String,
  date: String,
});

const Rating = mongoose.model('Rating', ratingSchema, 'ratings');

const userSchema = new mongoose.Schema({
  username: String,
});

const User = mongoose.model('User', userSchema, 'users');

const claimSchema = new mongoose.Schema({
  claimDate: Date,
  claimUser: String,
  jobId: String,
  claimComment: String,
  severity: String,
});

const Claim = mongoose.model('Claim', claimSchema, 'claims');

const truckSchema = new mongoose.Schema({
  truckNumber: String,});

const Truck = mongoose.model('Truck', truckSchema, 'trucks');

const accidentSchema = new mongoose.Schema({
  truckNumber: String,
  driver: String,
  accidentDate: Date,
  accidentComment: String,
});

const Accident = mongoose.model('Accident', accidentSchema, 'accidents');





// Express route to handle the POST from the client
app.post('/addCashPayment', async (req, res) => {
  try {
    const { jobId, cashAmount, driver, date } = req.body;

    // Create a new cash payment instance
    const newCashPayment = new CashPayment({ jobId, cashAmount, driver, date });

    // Save the cash payment to the database
    await newCashPayment.save();

    console.log('Cash payment added successfully:', newCashPayment); // Log the added cash payment

    res.status(200).json({ success: true, message: 'Cash payment added successfully.' });
  } catch (error) {
    console.error('Error adding cash payment:', error);
    res.status(500).json({ success: false, message: 'Error adding cash payment.' });
  }
});

// Express route to handle fetching cash payments based on the selected month
app.get('/cashPayments', async (req, res) => {
  try {
      const { month } = req.query;

      // a query to fetch cash payments for the specified month from the database
      const cashPayments = await CashPayment.find({
          date: { $regex: `^${month}` },
      });

      res.json(cashPayments);
  } catch (error) {
      console.error('Error fetching cash payments:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

const cashPaymentSchema = new mongoose.Schema({
  // Your schema definition here
  jobId: String,
  cashAmount: String,
  driver: String,
  date: String,
  received: Boolean,
});

const CashPayment = mongoose.model('CashPayment', cashPaymentSchema);

module.exports = CashPayment;


app.put('/updateCashPaymentReceivedStatus', async (req, res) => {
  try {
    const { cashPaymentId, received } = req.body;

    // Assuming you are using MongoDB with Mongoose
    const updatedCashPayment = await CashPayment.findByIdAndUpdate(
      cashPaymentId,
      { $set: { received: received } },
      { new: true }
    ).exec();

    if (!updatedCashPayment) {
      return res.json({ success: false, message: 'No cash payment updated.' });
    }

    return res.json({ success: true, message: 'Received status updated successfully.' });
  } catch (error) {
    console.error('Error updating received status:', error);
    return res.json({ success: false, message: 'Error updating received status.' });
  }
});



app.get('/searchAccidents', async (req, res) => {
  const { driver, truckNumber, startDate, endDate } = req.query;

  try {
     let query = {};

     if (truckNumber) {
        query.truckNumber = truckNumber;
     }

     if (driver) {
        query.driver = driver;
     }

     if (startDate && endDate) {
        query.accidentDate = {
           $gte: new Date(startDate),
           $lt: new Date(endDate + 'T23:59:59.999Z'),
        };
     }

     console.log('Search query:', query);

     let searchResults = await Accident.find(query);

     console.log('Search results (before sorting):', searchResults);

     // Send the search results as JSON
     res.json(searchResults);
  } catch (error) {
     console.error('Error searching accidents:', error);
     res.status(500).json({ success: false, message: 'Error searching accidents' });
  }
});

// Add this route to handle user submission
app.post('/submitUser', async (req, res) => {
  try {
    const { username } = req.body;

    // Check if the username is undefined or an empty string
    if (username === undefined || username.trim() === '') {
      return res.status(400).json({ success: false, message: 'Username cannot be empty' });
    }

    // Trim the username
    const trimmedUsername = username.trim();

    const existingUser = await User.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const newUser = new User({ username: trimmedUsername });
    const savedUser = await newUser.save();

    console.log('User added successfully:', savedUser);
    res.json({ success: true, message: 'User added successfully' });
  } catch (error) {
    console.error('Error submitting user:', error);
    res.status(500).json({ success: false, message: 'Error submitting user' });
  }
});

app.post('/submitAccident', async (req, res) => {
  try {
    const { truckNumber, driver, accidentDate, accidentComment } = req.body;

    const newAccident = new Accident({
      truckNumber,
      driver,
      accidentDate,
      accidentComment,
    });

    const savedAccident = await newAccident.save();
    console.log('Accident submitted successfully!', savedAccident);
    res.json({ success: true, message: 'Accident submitted successfully!' });
  } catch (error) {
    console.error('Error submitting accident:', error);
    res.status(500).json({ success: false, message: 'Error submitting accident' });
  }
});


// Endpoint to fetch truck numbers
app.get('/truckNumbers', async (req, res) => {
  try {
    const truckNumbers = await Truck.distinct('truckNumber');
    console.log('Fetched truck numbers:', truckNumbers); // Log truck numbers
    res.json(truckNumbers);
  } catch (err) {
    console.error('Error fetching truck numbers:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/home.html');
});

app.get('/claims', (req, res) => {
  res.sendFile(__dirname + '/claims.html');
});

app.post('/submitClaim', async (req, res) => {
  try {
    const { claimDate, claimUser, jobId, claimComment, severity } = req.body;

    const newClaim = new Claim({
      claimDate,
      claimUser,
      jobId,
      claimComment,
      severity,
    });

    const savedClaim = await newClaim.save();
    console.log('Claim submitted successfully!', savedClaim);
    res.json({ success: true, message: 'Claim submitted successfully!' });
  } catch (error) {
    console.error('Error submitting claim:', error);
    res.status(500).json({ success: false, message: 'Error submitting claim' });
  }
});

app.get('/', async (req, res) => {
  try {
    const employeeNames = await User.distinct('username');
    res.render(__dirname + '/index.html', { employeeNames });
  } catch (error) {
    console.error('Error fetching employee names:', error);
    res.status(500).send('Error fetching employee names');
  }
});

app.post('/submit', async (req, res) => {
  try {
    const { employeeName, appearanceRating, packingRating, truckRating, comments } = req.body;
    const currentDate = new Date().toLocaleDateString();
    const newRating = new Rating({
      employeeName,
      appearanceRating,
      packingRating,
      truckRating,
      comments,
      date: currentDate,
    });

    const savedRating = await newRating.save();
    console.log('Rating submitted successfully!', savedRating);
    res.send('Rating submitted successfully!');
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).send('Error submitting rating');
  }
});

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

app.get('/ratings', async (req, res) => {
  try {
    const { employeeName, month } = req.query;
    console.log('Received ratings request:', { employeeName, month });

    if (!employeeName || !month) {
      return res.status(400).send('Employee name and month are required.');
    }

    // Log the raw month value to understand what is bei
    console.log('Raw month value:', month);

    // Parse the selected month
    const parsedMonth = moment(month, 'YYYY-MM');

    // Log the parsed month value to see if is correct
    console.log('Parsed month value:', parsedMonth.format('YYYY-MM'));

    // Create a date range for the selected month
    const startDate = parsedMonth.startOf('month').format('MM/DD/YYYY');
    const endDate = parsedMonth.endOf('month').format('MM/DD/YYYY');

    // Log the date range to sees correct
    console.log('Date range:', startDate, 'to', endDate);

    const ratings = await Rating.find(
      {
        employeeName,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      },
      'employeeName appearanceRating packingRating truckRating comments date'
    );

    console.log('Ratings sent to the client:', ratings);

    if (ratings.length === 0) {
      console.log('No ratings found for the specified date range.');
    }

    res.json(ratings);
  } catch (error) {
    console.error('Error retrieving ratings:', error);
    res.status(500).send('Error retrieving ratings');
  }
});








app.get('/usernames', async (req, res) => {
  try {
    const employeeNames = await User.distinct('username');
    res.json(employeeNames);
  } catch (error) {
    console.error('Error fetching employee names:', error);
    res.status(500).send('Error fetching employee names');
  }
});

app.post('/addUser', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username.trim()) {
      return res.status(400).json({ success: false, message: 'Username cannot be empty' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const newUser = new User({ username });
    const savedUser = await newUser.save();

    console.log('User added successfully:', savedUser);
    res.json({ success: true, message: 'User added successfully' });
  } catch (error) {
    console.error('Error adding user:', error);
    res.status(500).json({ success: false, message: 'Error adding user' });
  }
});
app.get('/userExists', async (req, res) => {
  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ exists: false, message: 'Username is required for existence check.' });
    }

    const existingUser = await User.findOne({ username });
    res.json({ exists: !!existingUser }); // Send true if the user exists, false otherwise
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ exists: false, message: 'Error checking user existence' });
  }
});
app.delete('/deleteUser', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required for deletion.' });
    }

    const deletionResult = await User.deleteOne({ username });

    if (deletionResult.deletedCount > 0) {
      console.log('User deleted successfully:', username);
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found for deletion.' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

app.delete('/deleteUser', async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ success: false, message: 'Username is required for deletion.' });
    }

    const deletionResult = await User.deleteOne({ username });

    if (deletionResult.deletedCount > 0) {
      console.log('User deleted successfully:', username);
      res.json({ success: true, message: 'User deleted successfully' });
    } else {
      res.status(404).json({ success: false, message: 'User not found for deletion.' });
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Error deleting user' });
  }
});

app.post('/searchClaims', async (req, res) => {
  try {
    const { searchUser, searchById, searchId, startDate, endDate } = req.body;
    console.log('Received search request:', { searchUser, searchById, searchId, startDate, endDate });

    let query = {};

    if (searchUser) {
      query.claimUser = searchUser;
    }

    if (searchById) {
      query.jobId = searchId;
    }

    if (startDate && endDate) {
      query.claimDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate + 'T23:59:59.999Z'), // Adjust to include the entire end day
      };
    }

    console.log('Search query:', query);

    const claims = await Claim.find(query);

    console.log('Search results:', claims);

    res.json(claims);
  } catch (error) {
    console.error('Error searching claims:', error);
    res.status(500).json({ success: false, message: 'Error searching claims' });
  }
});




app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});




const PORT = process.env.PORT || 3000

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

//Routes go here
app.all('*', (req,res) => {
    res.json({"every thing":"is awesome"})
})

//Connect to the database before listening
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("listening for requests");
    })
})
