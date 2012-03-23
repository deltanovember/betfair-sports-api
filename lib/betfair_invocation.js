// (C) 2012 Anton Zemlyanov
//
// This module implements a generic Betfair Sports API invocation (SOAP protocol)
// see Sports API documentation on http://bdp.betfair.com
//
// Exported properties:
//   services      - list of possible Sports API services, curently three SOAP endpoints
//   newInvocation - create and return SOAP invocation object

var url = require("url");
var https = require("https");
var util = require("util");
var events = require("events");

var encoder = require("./betfair_encoder.js")
var decoder = require("./betfair_decoder.js")

var services = {
    global : "https://api.betfair.com/global/v3/BFGlobalService",
    uk : "https://api.betfair.com/exchange/v5/BFExchangeService",
    aus : "https://api-au.betfair.com/exchange/v5/BFExchangeService"
};

exports.services = services;
exports.invocation = newInvocation;

var port = 443;
var schemas = {
    global : "http://www.betfair.com/publicapi/v3/BFGlobalService/",
    exchange : "http://www.betfair.com/publicapi/v5/BFExchangeService/",
}

function newInvocation(service, action, request) {
    return new BetfairInvocation(service, action, request);
}

function BetfairInvocation(service, action, request) {
    this.service = service;
    this.schema = (service === services.global ? schemas.global
            : schemas.exchange);
    this.action = action;
    this.request = request;
    
    this.xmlRequestBody = "";
    this.xmlResponseBody = "";
}

BetfairInvocation.prototype.execute = function(callback) {
    var self = this;

    this.xmlRequestBody = encoder
            .encode(this.action, this.schema, this.request);
    console.log("XML request:");
    console.log(this.xmlRequestBody);
    
    var parsedUrl = url.parse(this.service);
    var httpOptions = {
        host : parsedUrl.hostname,
        port : port,
        path : parsedUrl.pathname,
        method : 'POST',
        headers : {
            SOAPAction : this.action
        }
    }

    var req = https.request(httpOptions, function(res) {
        //console.log("statusCode: ", res.statusCode);
        //console.log("headers: ", res.headers);
        res.on('data', function(data) {
            self.xmlResponseBody += data;
        });
        res.on('end', function(data) {
            console.log("XML response:");
            console.log(self.xmlResponseBody);
            var parsed = decoder.decode(self.xmlResponseBody);
            callback(parsed);
        });
    });

    req.write(this.xmlRequestBody);
    req.end();
}