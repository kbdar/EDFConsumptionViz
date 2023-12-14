exports = async function(changeEvent) {
   
    yesterday = new Date()
    //initialize todays date in the yyyy-mm-dd format
    dtToday = await context.functions.execute('formatDate', new Date())
    //initialize yesterdays  date in the yyyy-mm-dd format
    yesterday.setDate(yesterday.getDate() - 1);
    dtYesterday = await context.functions.execute('formatDate',yesterday)
    

    // Initialize the ENEDIS API enpoint
    const url = 'https://conso.boris.sh/api/consumption_load_curve';
    // Initialize the API Token provided by ENEDIS
    const APIToken = "<ENEDIS Token here>";//ENEDIS token;
    
    const params = {
      prm: '<replace with linky prm>', 
      start: dtYesterday,
     end: dtToday,
    };

const headers = {
  'Authorization': [`Bearer ${APIToken}`]
};

const queryString = Object.keys(params)
  .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(params[key]))
  .join('&');

const fullUrl = url + '?' + queryString;
    try {
        let response = await context.http.get({
          url:fullUrl,
          headers: headers,
        });

        // Parse the JSON response and prepare a set of documents to insert into MongoDB
        let responseData = EJSON.parse(response.body.text());
        const fieldsToInclude = ['usage_point_id','start','end','quality','reading_type'];

       const docArray = [];
       var docP = responseData["reading_type"];

for (const item of responseData["interval_reading"]) {
    const doc = {
        "usage_point_id": responseData["usage_point_id"]
    };

    for (const [key, value] of Object.entries(docP)) {
        doc[key] = value;
    }

    for (const [key, value] of Object.entries(item)) {
        if (key === "date") {
            doc[key] = new Date(value); 
        } else if (key === "value") {
            doc[key] = parseInt(value, 10); 
        } else {
            doc[key] = value;
        }
    }
    docArray.push(doc);
}
// Get the cluster in MongoDB Atlas.
            const mongodb = context.services.get('mongodb-atlas');
            const db = mongodb.db('electricity'); // Replace with your database name.
            const collection = db.collection('consumption'); // Replace with your collection name.
            const collectionTS = db.collection('consumptionTS'); // Replace with your TS collection name.

            // Insert many the documents in MongoDB to a normal collection and a time series collection
            const result = await collection.insertMany(docArray);
            const resultTS = await collectionTS.insertMany(docArray);
    } catch(err) {
        console.error(err);
    }
    return "success"
}
