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

## Local Development

### Install dependencies

```
yarn install
```

### Migrate local dynamodb

```
sls dynamodb install
```

### Create `env-auth.yml` file

```
cp env-auth.yml.example env-auth.yml
```

Fill the `env-auth.yml` file with the values of the environment variables.

### Run serverless offline

In order to run a local version of the project (API Gateway + Lambda + DynamoDB), execute the following command:

```
sls offline start
```

Now, you can test the endpoints available on the local server:

```
http://localhost:3000/
```

## Testing

```
yarn test
```

### Get Coverage percentage and HTML file

```
yarn test --coverage
```

## Deployment

In order to deploy, you need to run the following command:

### Development stage

```
yarn deploy
```

### Production stage

```
yarn deploy:api
```
