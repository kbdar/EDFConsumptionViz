from tqdm import tqdm
from time import sleep
import requests
import pymongo
import settings
from datetime import datetime,timedelta
url = settings.ENEDIS_API

headers = {
    'Authorization': f'Bearer {settings.TOKEN}',
}
try:
    
    client = pymongo.MongoClient(settings.URI_STRING)
    print("Connected to MongoDB")
    print("Fetching data from ENEDIS and inserting to MongoDB")
    db = client[settings.DBTS]
    coll = db[settings.COLL_ELEC_TS]
    current_date = datetime.now()
    # Calculate the start date (current date - 2 years)
    start_date = current_date - timedelta(days=730)
    
    # Loop through all days from start_date to current_date
    current_day = start_date
    next_day = start_date
    #tqdm to display a progress bar for your process, 730 days = 2 years
    with tqdm(total=730,desc="Processing",unit=" Day") as pbar:
        while current_day < current_date:
            response = ""
            docP = ""
            reading_array = ""
            docArray = []
            next_day += timedelta(days=1)
            params = ""
            params = {
                'prm': settings.LINKY_PRM,
                'start': current_day.strftime('%Y-%m-%d'),
                'end': next_day.strftime('%Y-%m-%d'),
                }
            response = requests.get(url, params=params, headers=headers)
            response.raise_for_status()  # Raise an exception for 4xx and 5xx status codes
            reading_array = response.json()["interval_reading"]
            docP = response.json()["reading_type"]

            for item in reading_array:
                doc = {}
                doc = {
                    "usage_point_id": response.json()["usage_point_id"]
                    }
                for key, value in docP.items():
                    doc[key] = value
                for key, value in item.items():
                    if(key=="date"):
                        doc[key] = datetime.strptime(value,'%Y-%m-%d %H:%M:%S')
                    elif(key=="value"):
                        doc[key] = int(value)
                    else:
                        doc[key] = value
                docArray.append(doc)
            coll.insert_many(docArray)
            current_day += timedelta(days=1)
            pbar.update(1)
            sleep(1)
        

    
except requests.exceptions.RequestException as err:
    print(f"Error: {err}")
