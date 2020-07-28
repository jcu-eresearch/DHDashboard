# Digital Homestead
This project provides a dashboard for the Digital Homestead project.
Dependencies include node.js, bower, and MongoDB.

## What does the Digital Homestead system do?
Data from tracking cattle movements and from walk over weigh stations was transmitted using _taggle_ radios via a _PubNub_ feed. This data was fed into a MongoDB database as it came in. 
There are 2 R scripts that were run against the MongoDB (they can be found in the jcu-eresearch/DigitalHomesteadContainers repository): 

- one was run hourly, this converts the data into JSON format that the _plotly_ library can use to display the graphs; 
- the second script was run daily and uses an algorithm for getting rid of noisy data points. 

The dashboard website is served by NodeJS behind an Apache reverse proxy.

## Installation
Execute the following steps to run:

    git clone https://github.com/jcu-eresearch/DHDashboard.git
    cd DHDashboard
    npm install
    bower install

## Register Receivers or Stations to recieve data from
Help for the addStation.js utility:
  
    # node bin/addStation.js --help
       
    Usage: addStation [options]
    
    Add and remove allowed station and receivers to Digital Homestead Database
    
    Options:
    
    -h, --help                        output usage information
    -V, --version                     output the version number
    -s, --station [station]           Add Station
    -r, --reciever [reciever]         Add Reciever
    -S, --remove-station [station]    Remove Station
    -R, --remove-reciever [reciever]  Remove Reciever

### Receivers
To register reciever `211` execute:

    # node bin/addStation.js -r 211 

### Stations
To register station `110171` execute:

    # node bin/addStation.js -s 110171

## Run Server
To launch the Digital Homestead Dashboard execute:

    # node server.js
