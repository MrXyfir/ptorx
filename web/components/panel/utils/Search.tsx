import { InputAdornment, TextField } from '@material-ui/core';
import { Search as SearchIcon } from '@material-ui/icons';
import { PrimaryEmailMatches } from 'components/panel/primary-emails/Matches';
import { ModifierMatches } from 'components/panel/modifiers/Matches';
import { MessageMatches } from 'components/panel/messages/Matches';
import { DomainMatches } from 'components/panel/domains/Matches';
import { FilterMatches } from 'components/panel/filters/Matches';
import { AliasMatches } from 'components/panel/aliases/Matches';
import { PanelContext } from 'lib/PanelContext';
import * as React from 'react';
import * as Fuse from 'fuse.js';

export const SearchInput = () => (
  <PanelContext.Consumer>
    {({ search, dispatch, categories }) => (
      <TextField
        id="search"
        type="search"
        value={search}
        margin="normal"
        variant="outlined"
        onChange={e => dispatch({ search: e.target.value.toLowerCase() })}
        fullWidth
        autoFocus
        placeholder={`Search for ${categories.join(', ').toLowerCase()}...`}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          )
        }}
      />
    )}
  </PanelContext.Consumer>
);

export class SearchMatches extends React.Component {
  static contextType = PanelContext;
  context!: React.ContextType<typeof PanelContext>;

  search<
    T extends {
      fullAddress?: string;
      subject?: string;
      address?: string;
      domain?: string;
      type?: string;
      name?: string;
      from?: string;
    }
  >(items: T[]): T[] {
    const { search } = this.context;
    if (search) {
      const fuse = new Fuse(items, {
        shouldSort: true,
        threshold: 0.4,
        keys: [
          'from',
          'name',
          'type',
          'domain',
          'address',
          'subject',
          'fullAddress'
        ]
      });
      items = fuse.search(search);
    }
    return items;
  }

  render() {
    const {
      primaryEmails,
      aliases,
      categories,
      modifiers,
      messages,
      domains,
      filters
    } = this.context;
    return (
      <div>
        {categories.indexOf('Aliases') > -1 && aliases.length ? (
          <AliasMatches aliases={this.search(aliases)} />
        ) : null}
        {categories.indexOf('Messages') > -1 && messages.length ? (
          <MessageMatches messages={this.search(messages)} />
        ) : null}
        {categories.indexOf('Primary Emails') > -1 && primaryEmails.length ? (
          <PrimaryEmailMatches primaryEmails={this.search(primaryEmails)} />
        ) : null}
        {categories.indexOf('Filters') > -1 && filters.length ? (
          <FilterMatches filters={this.search(filters)} />
        ) : null}
        {categories.indexOf('Modifiers') > -1 && modifiers.length ? (
          <ModifierMatches modifiers={this.search(modifiers)} />
        ) : null}
        {categories.indexOf('Domains') > -1 && domains.length ? (
          <DomainMatches domains={this.search(domains)} />
        ) : null}
      </div>
    );
  }
}

export const Search = () => (
  <React.Fragment>
    <SearchInput />
    <SearchMatches />
  </React.Fragment>
);