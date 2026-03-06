interface ConsistencySquareProps {
  completed: boolean;
  started: boolean;
  isToday: boolean;
}

export function ConsistencySquare({
  completed,
  started,
  isToday,
}: ConsistencySquareProps) {
  if (completed) {
    return <div className="size-5 rounded-md bg-consistency-full" />;
  }

  if (started) {
    return <div className="size-5 rounded-md bg-consistency-half" />;
  }

  if (isToday) {
    return (
      <div className="size-5 rounded-md border-[1.6px] border-consistency-full" />
    );
  }

  return (
    <div className="size-5 rounded-md border border-border bg-consistency-none" />
  );
}
