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
      query getExperience {
        experience(id: 5) {
          actions {
            ...ActionsParts
          }
        }
      }
    `;
    expect(query).not.toBe(null);
  });
});

