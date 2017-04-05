# Digital Homestead
This project provides a dashboard for the Digital Homestead project.
Dependencies include node.js, bower, and MongoDB.

## Instillation
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
To register station `211` execute:

    # node bin/addStation.js -r 211 

### Stations
To register station `110171` execute:

    # node bin/addStation.js -s 110171

## Run Server
To launch the Digital Homestead Dashboard execute:

    # node server.js