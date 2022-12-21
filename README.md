# Serverless Tick Webhook

## Setup

### Install Serverless Framework

```
npm install -g serverless
```

### Configure AWS Credentials

```
serverless config credentials --provider aws --key YOUR_KEY --secret YOUR_SECRET
```

## Testing

```
yarn test
```

## Deployment

In order to deploy, you need to run the following command:

### Stage: dev
```
yarn deploy
```

### Stage: prod
```
yarn deploy:prod
```
