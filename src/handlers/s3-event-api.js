const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.S3_EVENT_TABLE;

exports.s3EventApiHandler = (event, context, callback) => {
    
    const done = (err, res) => callback(null, {
        statusCode: err ? '400' : '200',
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });
    let parameters = event.queryStringParameters;    

    //// handle call to get details about file changes
    if(parameters && parameters.hasOwnProperty('file')){        
        const fileName = parameters.file;
        try {
            const documentGetParams = {
                TableName: tableName,
                ProjectionExpression:"fileName, size, #state, #fileTimestamp",
                KeyConditionExpression: "fileName = :fname",
                ExpressionAttributeNames:{
                    "#fileTimestamp": "timestamp",
                    "#state": "status"       
                },
                ExpressionAttributeValues: {
                    ":fname": fileName,        
                }
            }
            
            documentClient.query(documentGetParams, function(err, data) {
                if (err) {
                    console.log(err, err.stack);
                    throw err;
                } else {                    
                    done(null, data.Items)                
                }
            });
        } catch(e) {
            console.error(e);
            done(new Error(`Request failed, error details : "${e}"`));
        } 
    } //// handle call to list all files
    else if(parameters && parameters.hasOwnProperty('list')){   
        const listVal = parameters.list;
        if(listVal != 'true') {
            done(new Error("Unsupported operation for list"));
        }
        try {
            const documentListParams = {
                TableName: tableName,
                IndexName: 'versionGSI',
                ProjectionExpression:"fileName",
                KeyConditionExpression: "versionId = :versionId",    
                ExpressionAttributeValues: {            
                    ":versionId": "v_0",        
                }
            }
            documentClient.query(documentListParams, function(err, data) {
                if (err) {
                 console.log(err, err.stack);
                } else {
                    let objList = [];
                    if(data.Items){
                        data.Items.map(item => {
                            objList.push(item.fileName);
                        })
                    }
                    done(null, objList)                
                }
            });  
        } catch(e) {
            console.error(e);
            done(new Error(`Request failed, error details : "${e}"`));
        }
    }
    else if(parameters && parameters.hasOwnProperty('last')){           
        getRecentVal = parseInt(parameters.last);
        if(!Number.isInteger(getRecentVal)) {
            done(new Error("Please provide proper value !!"));
        }
        try {
            const metadataName = "Metadata_" + tableName;
            const metadataSortKey = "0000";
            const documentRecentRecordsParams = {
                TableName: tableName,
                Key: {
                    "fileName" : metadataName,
                    "timestamp": metadataSortKey
                }
            }
            documentClient.get(documentRecentRecordsParams, function(err, data) {
                if (err) {
                 console.log(err, err.stack);
                } else {
                    let itemList = [];
                    if(data.Item && data.Item.latestRecords) {
                        itemList = data.Item.latestRecords.slice(0,getRecentVal);                                                                
                    }
                    console.log(itemList);
                    done(null, itemList)                
                }
            });  
        } catch(e) {
            console.error(e);
            done(new Error(`Request failed, error details : "${e}"`));
        }
    }
     else {
        done(new Error(`Unsupported method request for operation "${event.httpMethod}"`));
    }
    
};