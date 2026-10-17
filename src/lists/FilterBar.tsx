// The filter bar above a list: words to find, the tags in the list to pick from, and a switch for
// the rejected. It shows and changes a ListFilter; what it filters is the list's.
import type { ListFilter } from './list-filter.ts';
import './lists.css';
import './FilterBar.css';

type FilterBarProps = {
  filter: ListFilter;
  onChange: (filter: ListFilter) => void;
  tagCounts: { name: string; count: number }[];
  placeholder: string;
};

/** The filter bar. */
export function FilterBar({ filter, onChange, tagCounts, placeholder }: FilterBarProps) {
  function toggleTag(name: string): void {
    const tags = filter.tags.includes(name)
      ? filter.tags.filter((tag) => tag !== name)
      : [...filter.tags, name];
    onChange({ ...filter, tags });
  }
  return (
    <div className="filter-bar">
      <input
        type="search"
        className="filter-words"
        placeholder={placeholder}
        value={filter.words}
        onChange={(event) => onChange({ ...filter, words: event.target.value })}
      />
      <label className="filter-switch">
        <input
          type="checkbox"
          checked={filter.isShowingRejected}
          onChange={(event) => onChange({ ...filter, isShowingRejected: event.target.checked })}
        />
        rejected
      </label>
      {tagCounts.length > 0 && (
        <div className="tag-row">
          {tagCounts.map(({ name, count }) => (
            <button
              key={name}
              type="button"
              className={`tag-chip${filter.tags.includes(name) ? ' is-on' : ''}`}
              onClick={() => toggleTag(name)}
            >
              {name} <span className="tag-count">{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
