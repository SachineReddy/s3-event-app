#S3 Event App 

s3-event-app [SAM project which creates lambda, API gateway, dynamoDB, S3 using template.yaml]  

Serverless app which keeps a track of files added, modified, deleted in s3 bucket

---------------------------------------------------------------------------------------------------------------

Endpoints to get details using API gateway

1. Get list of files
	https://<URL>.execute-api.us-east-1.amazonaws.com/Stage/events/object?list=true

2. Get changes for a particular file 
	https://<URL>.execute-api.us-east-1.amazonaws.com/Stage/events/object?file=p.txt
	
3. Get last N changes 
	https://<URL>.execute-api.us-east-1.amazonaws.com/Stage/events/object?last=5

---------------------------------------------------------------------------------------------------------------