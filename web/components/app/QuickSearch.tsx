import { modifierTypes, filterTypes } from 'constants/types';
import { ListItem, Button, List } from 'react-md';
import { findMatching } from 'lib/find-matching';
import { Search } from 'components/common/Search';
import * as React from 'react';
import { Link } from 'react-router-dom';

const ShowMoreButton = ({
  total,
  limit,
  link
}: {
  total: number;
  limit: number;
  link: string;
}) =>
  total <= limit ? null : (
    <Link to={link}>
      <Button flat primary>
        Show {total - limit} More
      </Button>
    </Link>
  );

export class QuickSearch extends React.Component {
  constructor(props) {
    super(props);

    this.state = { search: { query: '' } };
  }

  _renderEmails(emails: any[]) {
    const q = this.state.search.query;

    return (
      <section>
        <header>
          <h1>Emails</h1>
          <ShowMoreButton
            link={`/app/emails/list?q=${encodeURIComponent(q)}`}
            limit={7}
            total={emails.length}
          />
        </header>

        <List className="proxy-emails-list section md-paper md-paper--1">
          {emails.slice(0, 7).map(email => (
            <Link to={`/app/emails/edit/${email.id}`} key={email.id}>
              <ListItem
                threeLines
                className="email"
                primaryText={email.name}
                secondaryText={email.address + '\n' + email.description}
              />
            </Link>
          ))}
        </List>
      </section>
    );
  }

  _renderFilters(filters: any[]) {
    const q = this.state.search.query;

    return (
      <section>
        <header>
          <h1>Filters</h1>
          <ShowMoreButton
            link={`/app/filters/list?q=${encodeURIComponent(q)}`}
            limit={5}
            total={filters.length}
          />
        </header>

        <List className="filters-list section md-paper md-paper--1">
          {filters.slice(0, 5).map(filter => (
            <Link to={`/app/filters/edit/${filter.id}`} key={filter.id}>
              <ListItem
                threeLines
                className="filter"
                primaryText={filter.name}
                secondaryText={
                  filterTypes[filter.type] + '\n' + filter.description
                }
              />
            </Link>
          ))}
        </List>
      </section>
    );
  }

  _renderDomains(domains: any[]) {
    const q = this.state.search.query;

    return (
      <section>
        <header>
          <h1>Domains</h1>
          <ShowMoreButton
            link={`/app/domains/list?q=${encodeURIComponent(q)}`}
            limit={3}
            total={domains.length}
          />
        </header>

        <List className="domains-list section md-paper md-paper--1">
          {domains.slice(0, 3).map(domain => (
            <Link to={`/app/domains/${domain.id}`} key={domain.id}>
              <ListItem primaryText={domain.domain} />
            </Link>
          ))}
        </List>
      </section>
    );
  }

  _renderModifiers(modifiers: any[]) {
    const q = this.state.search.query;

    return (
      <section>
        <header>
          <h1>Modifiers</h1>
          <ShowMoreButton
            link={`/app/modifiers/list?q=${encodeURIComponent(q)}`}
            limit={5}
            total={modifiers.length}
          />
        </header>

        <List className="modifiers-list section md-paper md-paper--1">
          {modifiers.slice(0, 5).map(modifier => (
            <Link to={`/app/modifiers/edit/${modifier.id}`} key={modifier.id}>
              <ListItem
                threeLines
                className="modifier"
                primaryText={modifier.name}
                secondaryText={
                  modifierTypes[modifier.type] + '\n' + modifier.description
                }
              />
            </Link>
          ))}
        </List>
      </section>
    );
  }

  render() {
    const { emails, filters, domains, modifiers } = this.props.App.state;
    const { search } = this.state;
    const matches = {
      emails: findMatching(emails, search),
      filters: findMatching(filters, search),
      domains: findMatching(domains, search),
      modifiers: findMatching(modifiers.filter(m => !m.global), search)
    };

    return (
      <div className="quick-search">
        <Search onSearch={v => this.setState({ search: v })} type="email" />

        {matches.emails.length ? this._renderEmails(matches.emails) : null}
        {matches.filters.length ? this._renderFilters(matches.filters) : null}
        {matches.modifiers.length
          ? this._renderModifiers(matches.modifiers)
          : null}
        {matches.domains.length ? this._renderDomains(matches.domains) : null}
      </div>
    );
  }
}
