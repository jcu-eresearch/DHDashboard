
var pubnub = PUBNUB({
    ssl: true,  // <- enable TLS Tunneling over TCP
    publish_key: "demo",
    subscribe_key: "sub-c-3d7ba416-92ba-11e3-b2cd-02ee2ddab7fe"
});
var pubnub_channels =  ["jcu.180181"];
var locations = {
    110177:{
        name:"Spring Creek",
        lat: -19.66882,
        long: 146.864
    },
    110171:{
        name: "Double Barrel",
        lat: -19.66574,
        long: 146.8462
    },
    110163:{
        name: "Junction",
        lat: -19.66872,
        long: 146.8642
    }
};
register_digitalHomesteadLive_component(homesteadApp, "components/digitalhomesteadlive/digitalhomesteadlive.templ.html", pubnub, pubnub_channels, locations);