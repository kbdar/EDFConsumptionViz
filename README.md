
## Electricity Consumption data visualization

This demo demonstrates how you can use __MongoDB TIME SERIES collections__ and __MongoDB Developer Data Platform__  to build a fully functional system to retrieve your electricity meter data, drastically reduce your data storage footprint for time series data and reduce architectural complexity of your system. 
Here is what the data size in my 2 collections looks like. The data size is small for me but you can interpolate it for millions of customers that an energy provider has and get an idea. In my case as you can see I have a reduction of 95% in data size and 90% in storage size
<table><tr><td><img src='/image/comparison.png' alt=“” height="100" width="fit"></td></tr></table>


## Data Source

This demo is French market specific. EDF/Enedis have installed electronic meters called "Linky" in French households that transmit your energy consumption every 30 mins to your electricity provider (EDF,Total etc). The providers have developed applications that you can access to view your energy consumption. The data is also available in open source format over an API provided by different energy providers. I am connecting via this API to download my energy consumption reported at a frequency of every 30 minutes from the meter but downloadable as one single daily consumption file with data points every 30 minutes.

## The Code
Here is a short description of what the code does:
1. settings.py: Parameters for your import2Years.py program.
2. Optional - import2Years.py: Code to download the 2 years historic data, format it into smaller documents and insert the same data into 2 MongoDB collections (1 normal and 1 time series collection).
   Note: I have used “sleep” in the function to only have 1 request/second. If you execute a lot of requests you will get blocked by the API provider.
3. trigger.js: A function to associate to your scheduled trigger in MongoDB Atlas that will run once a day to get the previous day's consumption data.
4. formatDate.js: Used by triggers.js to format the date as required by the API.
---
## Setup

__1. Configure the MongoDB Atlas Environment__
* Log-on to your [Atlas account](http://cloud.mongodb.com) If you do not have a MongoDB Atlas cluster, you can create an account for free and a lifetime free cluster M0 on MongoDB Atlas.
* In the project's Security tab, choose to add a new user, e.g. __main_user__, and for __User Privileges__ specify __Read and write to any database__ (make a note of the password you specify)
* In the Security tab, add a new __IP Whitelist__ and allow access from everywhere.
* Create a free M0 (or a paid M10 if you wish)cluster based 3 node replica-set in a cloud provider region of your choice.
* In the Atlas console, for the database cluster you deployed, click the __Connect button__, select __Connect Your Application__, and for the __latest Node.js version__ copy the __Connection String Only__ - make a note of this MongoDB URL address to be used in the next step
Note: You will need to **create the timeSeries collection "consumptionTS"** explicitly (use Atlas UI to create it) where as the normal collection will get created based on the name specified in the **"parameters.py"**. 

__2. How to enable and access the API__
* You only need to have an electricity connection and a contract with one of the energy providers. You then will open an account at mon-compte.enedis.fr and enable the access to your linky.
You will then be provided with an access token that you can use to make API requests.
Here is 2 API that I used:
- API to get the 2 years historical data:
 ```
'https://conso.boris.sh/api/consumption_load_curve?prm=<your-prm>&start=2022-01-22&end=2022-01-23'
  ```
 Replace _<your-prm>_ with your prm ID and the start and end dates must be between the last 2 years.
 To get the data for day x you can enter the start date as day x and end date as day x+1.
 Here is a part of what the output of the API looks like:  
   ```
   {
        "usage_point_id": "21121707640844",
        "start": "2023-11-14",
        "end": "2023-11-17",
        "quality": "BRUT",
        "reading_type": {
            "unit": "W",
            "measurement_kind": "power",
            "aggregate": "average"
        },
        "interval_reading": [
            {
                "value": "1222",
                "date": "2023-11-14 00:30:00",
                "interval_length": "PT30M",
                "measure_type": "B"
            },
            {
                "value": "164",
                "date": "2023-11-14 01:00:00",
                "interval_length": "PT30M",
                "measure_type": "B"
            }
           ]
      }
```

**Note:**
Do not make too many requests or your IP address will be blocked.
Only make minimùal requests and for test purposes if you want to make a few requests, do it with some delay between 2 consecutive requests.


__3. Clone the code files in this repository__
* Open settings.py file and enter all your parameters as shown here:

```
URI_STRING = "mongodb+srv://<username>:<password>@yourcluster.mongodb.net/test?retryWrites=true&w=majority"
DBTS = "electricity"
COLLECTION = "embedded_movies"
COLL_ELEC = "consumption"
COLL_ELEC_TS = "consumptionTS"
TOKEN = "<Your enedis token here>"
ENEDIS_API = "https://conso.boris.sh/api/consumption_load_curve"
LINKY_PRM = "<Your linky PRM>"
```
Enter your MongoDB cluster URL as noted in Step 1, ENEDIS Token and your linky PRM, the rest of the parameters you can leave them as it is unless you want some special names for your DB and collections.

__3. Install Python3 and required libraries__
 ```
brew install python3
pip3 install tqdm
pip3 install pymongo
 ```
__4. Get 2 years of historical data__
You can download the 2 years of your meter data by running the following code.
 ```
python3 2yearsdata.py
 ```
The code will download the data, format it and update it to your MongoDB database. You will see a progress bar displayed to show you the progress of  the update.

__5. Create MongoDBAtlas Trigger__
Create a MongoDB Atlas Scheduled trigger to run once a day and get the data from the API, format the data and insert into MongoDB collections. I am inserting exactly the same data into 2 collections to demonstrate the advantages to time series collection. Here is how to do it:
* In MongoDB Atlas click on Triggers in the left menu.
* Give a name to your trigger and choose the "scheduled" option.
  <table><tr><td><img src='/image/schedule.png' alt=“” height="200" width="fit"></td></tr></table>
* On the advanced scheduled settings use the following cron expression to schedule your trigger at 7 AM in the morning.The recommended time by the author of the API is between 6 AM and 10 AM.
```
00 07 * * *
```
__5. Charts wuth natural language capabilities__
Go to "Charts" tab in your MongoDB Atlas and create your desired charts in a matter of minutes. Here is a screen grab of a few charts I created on my data.
<table><tr><td><img src='/image/charts.png' alt=“” height="400" width="fit"></td></tr></table>
MongoDB Atlas charts gives you the ability to create charts manually, how ever try the new natural language capability of MongoDb Atlas charts.
To do so, when you create a chart in MongoDb Atlas, clique on "natural  language" as shown:
<table><tr><td><img src='/image/chartsNLP.png' alt=“” height="400" width="fit"></td></tr></table>
An example of prompt I used:
Create me a chart to visualiee consumption of last one week. The consumption is in watt hours, convert it to Kilo watt hours.
Here is the output, a chart you can save and embed in your applications.





