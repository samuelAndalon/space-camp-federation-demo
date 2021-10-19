# Apollo Space Camp Demo Code

Forked repository from https://github.com/mandiwise/space-camp-federation-demo, adding data loaders to reduce and simplify
how the resolvers are accesing the data to fullfill the query schema.


The main goal of this is to try to find a way to batch queries from the federated gateway to downstream gql services.

**Installation:**

```sh
npm i && npm run server
```

resources

https://jira.expedia.biz/browse/BEXAPI-706


https://www.apollographql.com/blog/apollo-client/performance/batching-client-graphql-queries/#5853

https://medium.com/the-marcy-lab-school/what-is-the-n-1-problem-in-graphql-dd4921cb3c1a

https://medium.com/the-marcy-lab-school/how-to-use-dataloader-js-9727c527efd0

https://www.apollographql.com/docs/react/api/link/apollo-link-batch-http/

https://shopify.engineering/solving-the-n-1-problem-for-graphql-through-batching

https://itnext.io/how-to-avoid-n-1-problem-in-apollo-federation-8b4f37729fc4

https://spectrum.chat/apollo/apollo-server/query-batching-apollo-federation-vs-apollo-server~6326ceab-cb5d-4ba6-8306-eeeebb1b4575

https://github.com/apollographql/federation/issues/372