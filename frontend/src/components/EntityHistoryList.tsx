type HistoryItem = {
  title: string;
  description: string;
};

interface EntityHistoryListProps {
  items: HistoryItem[];
}

export function EntityHistoryList(props: EntityHistoryListProps) {
  const { items } = props;

  return (
    <div className="list">
      {items.map((item, index) => (
        <div className="list-item" key={`${item.title}-${index}`}>
          <strong>{item.title}</strong>
          <div className="muted">{item.description}</div>
        </div>
      ))}
    </div>
  );
}
