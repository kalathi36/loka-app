export const upsertById = <T extends { _id: string }>(items: T[], nextItem: T) => {
  const index = items.findIndex((item) => item._id === nextItem._id);

  if (index === -1) {
    return [nextItem, ...items];
  }

  const nextItems = [...items];
  nextItems[index] = nextItem;
  return nextItems;
};
