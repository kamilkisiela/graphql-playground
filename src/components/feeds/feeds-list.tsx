import { useFeedsQuery } from 'data/generated/graphql';

const FeedList = () => {
  const { data, loading, error } = useFeedsQuery();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error {error}</div>;
  }

  return (
    <div>
      <h3>Feeds List</h3>
      <ul>
        {data?.feeds?.map((item) => {
          return <li key={item?.id}>{item?.title}</li>;
        })}
      </ul>
    </div>
  );
};

export default FeedList;
