# Diviner
A small script that uses the data dump and API to determine update lengths  

## Setup  
To get setup, clone the repository and download [Node.js](https://nodejs.org/en/). Navigate to the repoistory and:  

To install dependencies, run:  
`npm i`  

To run the script:  
`node diviner.js`  

## Use  
You will be prompted to supply a nation name, and the nation will be verified. After this, the script will download the daily dumps, and get the time difference between the first and last updating region.  

After this, the script will attempt to get the length of minor by using the API. It is **only possible to determine the length of minor if the most recent update that has run is minor update**.  

After the script is done cleaning up, it will give you the length of major and minor (if it could be determined) in seconds.
