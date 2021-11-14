import gql from 'graphql-tag';

describe('gql tag', () => {
  test('gql object', () => {
    const query = gql`
      fragment ActionsParts on CustomerNotificationAction {
        __typename
        ... on CustomerNotificationAnalytics {
          description
          referrerId
        }
        ... on CustomerNotificationCookie {
          name
          value
          expires
        }
      }
      mutation permutation {
        user(id: 5) {
          firstName
          lastName
          mutation
        }
      }
    `;
    expect(query).toBe(null);
  });
});

