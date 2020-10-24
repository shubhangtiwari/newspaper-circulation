// Fetching the mongo client
const { MongoClient } = require('mongodb');

class MongoConnection {
    // Some private variables
    #uri;
    #dbName;
    #collection;
    #client;
    #db;

    // Fetching the db connection at time of initialization
    constructor(dbName, uri = 'mongodb://localhost:27017') {
        // Storing the values passed to the context of the object
        this.#dbName = dbName;
        this.#uri = uri;

        return this.connect();
    }

    /**
     * Returns the database name
     */
    getDbName() {
        return this.#dbName;
    }

    /**
     * Sets the database to connect to
     * @param {string} dbName Database to connect to
     * @returns Current object for method chaining
     */
    setDbName(dbName) {
        this.#dbName = dbName;
        return this.connect();
    }

    /**
     * Returns the collection name currently connected to
     */
    getCollection() {
        return this.#collection;
    }

    /**
     * Sets the collection name on which all the operations will be performed
     * @param {string} collection Collections anme
     * @returns Current object for method chaining
     */
    setCollection(collection) {
        this.#collection = collection;
        return this;
    }

    /**
     * Sets the db reference to the database name passed.
     * @returns Current object for method chaining
     */
    async connect() {
        if (!this.#client) {
            // Attempting the connection
            try {
                this.#client = new MongoClient(this.#uri, { useUnifiedTopology: true });
                await this.#client.connect()
            }
            catch (e) {
                throw Error('Failed to fetch mongo connection');
            }
        }

        if (this.#dbName) {
            this.#db = this.#client.db(this.#dbName);
        }
        else {
            throw Error('Database name is mandatory and cannot be ommitted');
        }

        return this;
    }

    /**
     * Closes the connection to mongodb
     */
    async close() {
        this.#client.close();
        this.#client = undefined;
    }

    /**
     * Validates if the connection exists
     */
    validateConnection() {
        try {
            this.#db = this.#client.db(this.#dbName);
        }
        catch (e) {
            throw Error('Connection to databse is poisoned. Try reconnecting.');
        }
    }

    /**
     * Lists all the collections in the database
     * @returns Promise
     */
    listCollections() {
        this.validateConnection();
        return this.#db.collections();
    }

    /**
     * Lists all the collections in the database
     * @returns Promise
     */
    clean() {
        this.validateConnection();
        this.#db.dropDatabase();
    }

    /**
     * Pushes the data to the collection
     * @param {array} data Data to be pushed
     * @param {string} [collection] Collection name
     * @returns Promise
     */
    create(data, collection = this.#collection) {
        this.validateConnection();
        return this.#db.collection(collection).insertMany(data)
            .then((response) => {
                console.log(`Inserted ${response.insertedCount} documents to ${this.#dbName} - ${this.#collection}`)
                return response;
            });
    }

    /**
     * Gets data from the collection
     * @param {object} [query={}] select query
     * @param {string} [collection] Collection name
     */
    get(query = {}, collection = this.#collection) {
        this.validateConnection();
        return this.#db.collection(collection).find(query).toArray();
    }

    /**
     * Deletes data from the collection
     * @param {object} [query={}] select query
     * @param {string} [collection] Collection name
     */
    delete(query = {}, collection = this.#collection) {
        this.validateConnection();
        return this.#db.collection(collection).deleteMany(query);
    }

    /**
     * Saves data to the collection
     * @param {object} [query={}] select query
     * @param {string} [collection] Collection name
     */
    update(data = {}, query = {}, collection = this.#collection) {
        this.validateConnection();
        return this.#db.collection(collection).update(query, {
            $set: data
        });
    }
}

module.exports = MongoConnection;