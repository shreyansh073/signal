const {connect} = require('getstream')

let streamClient = null;

function getStreamClient(){
    if(!streamClient){
        streamClient = connect(process.env.STREAM_API_KEY, process.env.STREAM_API_SECRET)
    }
    return streamClient;
}

module.exports = {getStreamClient}