// The filter bar above a list: words to find, ★ favorites to show only the kept ones, and the tags
// in the list to pick from. It shows and changes a ListFilter; what it filters is the list's.
import { Star } from 'lucide-react';
import type { ListFilter } from './list-filter.ts';
import './lists.css';
import './FilterBar.css';

type FilterBarProps = {
  filter: ListFilter;
  onChange: (filter: ListFilter) => void;
  tagCounts: { name: string; count: number }[];
  placeholder: string;
};

/**
 * Shows the filter bar: words to find, ★ for only the kept, and the list's tags to pick from.
 *
 * @param props - The component's props.
 * @param props.filter - The filter shown.
 * @param props.onChange - Called with the changed filter.
 * @param props.tagCounts - The tags in the list and how many items have each.
 * @param props.placeholder - The text in the words field while it is empty.
 * @returns The filter bar's element.
 */
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
        className="filter-bar-words"
        placeholder={placeholder}
        value={filter.words}
        onChange={(event) => onChange({ ...filter, words: event.target.value })}
      />
      <button
        type="button"
        className={`filter-bar-kept${filter.isKeptOnly ? ' is-on' : ''}`}
        onClick={() => onChange({ ...filter, isKeptOnly: !filter.isKeptOnly })}
        aria-pressed={filter.isKeptOnly}
        data-tooltip={filter.isKeptOnly ? 'show all' : 'show only the favorites (★)'}
      >
        <Star fill={filter.isKeptOnly ? 'currentColor' : 'none'} />
        favorites
      </button>
      {tagCounts.length > 0 && (
        <div className="filter-bar-tags">
          {tagCounts.map(({ name, count }) => (
            <button
              key={name}
              type="button"
              className={`list-chip${filter.tags.includes(name) ? ' is-on' : ''}`}
              onClick={() => toggleTag(name)}
            >
              {name} <span className="filter-bar-tag-count">{count}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
