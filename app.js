// Fetching our Mongo utility class
const MongoConnection = require('./helper.js');
const circulationData = require('./data/circulation.json');
const { ObjectId } = require('mongodb');
const express = require('express');
const app = express();
const port = process.env.port || 3000;

// Circulation db reference
let circulationDB;

(async () => {
    try {
        // Fetching the connection with the database and setting our collection
        circulationDB = await new MongoConnection('circulation');
        circulationDB.setCollection('newspaper');
        
        // Initial load in case not already done
        if (!(await circulationDB.get()).length) {
            await circulationDB.create(circulationData);
        }
    }
    catch (e) {
        console.error(`Failed to insert the data due to \n${e}`);
    }
})();

// Registering the get endpoint
app.get('/newspaper', async (req, res) => {
    let newspapers = await circulationDB.get();
    res.json(newspapers.map(newspaper => {
        return {
            _uri: `http://localhost:${port}/newspaper/${newspaper._id}`,
            ...newspaper
        }
    }));
})

// Registering the get by id endpoint
app.get('/newspaper/:id', async (req, res) => {
    res.json((await circulationDB.get({
        _id: ObjectId(req.params.id)
    }))[0]);
});

// Registering the delete by id endpoint
app.delete('/newspaper/:id', async (req, res) => {
    await circulationDB.delete({
        _id: ObjectId(req.params.id)
    });
    res.end();
});

// Using the JSON body parser
app.use(express.json());

// Registering the delete by id endpoint
app.put('/newspaper/:id', async (req, res) => {
    let response = await circulationDB.update(req.body, {
        _id: ObjectId(req.params.id)
    });

    // Checking if the data was upadted
    if (response.result.nModified) {
        res.json({
            _id: req.params.id,
            ...req.body
        });
    }
    else {
        res.statusCode = 400;
        res.end();
    }
});

// Registering the create endpoint
app.post('/newspaper', async (req, res) => {
    // Pushing data to the collection
    let response = await circulationDB.create(req.body);

    // Checking if the data was upadted
    if (response.result.n) {
        res.json(response.ops);
    }
    else {
        res.statusCode = 400;
        res.end();
    }
});

// Starting the service and listening on the port
app.listen(port, () => {
    console.log(`Newspaper service started and available at ${port}`);
})