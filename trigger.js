exports = async function(changeEvent) {
    yesterday = new Date()
    dtToday = await context.functions.execute('formatDate', new Date())
    yesterday.setDate(yesterday.getDate() - 1);
    dtYesterday = await context.functions.execute('formatDate',yesterday)
    

    // Conso API URL.
    const url = 'https://conso.boris.sh/api/consumption_load_curve';
    // Use the name you gave the value of your API key in the “Values” utility inside of App Services
    const APIToken = context.values.get("APIToken");
    
    const params = {
      prm: '21121707640844',
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

        // Parse the JSON response
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
            doc[key] = new Date(value); // Assuming 'value' is a string representing a date
        } else if (key === "value") {
            doc[key] = parseInt(value, 10); // Assuming 'value' is a string representing an integer
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
            const collectionTS = db.collection('consumptionTS'); // Replace with your collection name.

            // Insert many the documents in MongoDB.
            const result = await collection.insertMany(docArray);
            const resultTS = await collectionTS.insertMany(docArray);
    } catch(err) {
        console.error(err);
    }
    return "success"
}
