import {
  ListItem, Toolbar, Divider, Drawer, Button, List, FontIcon
} from 'react-md';
import React from 'react';

export default class AppNavigation extends React.Component {

  constructor(props) {
    super(props);

    this.state = { drawer: false };
  }

  /**
   * Delete access token and redirect to logout.
   */
  onLogout() {
    delete localStorage.accessToken;
    location.href = '/api/account/logout';
  }

  /** @return {JSX.Element[]} */
  _renderDrawerNavItems() {
    return [
      <a href='#/emails/list'>
        <ListItem
          leftIcon={<FontIcon>email</FontIcon>}
          primaryText='Emails'
        />
      </a>,
      <a href='#/filters/list'>
        <ListItem
          leftIcon={<FontIcon>filter_list</FontIcon>}
          primaryText='Filters'
        />
      </a>,
      <a href='#/modifiers/list'>
        <ListItem
          leftIcon={<FontIcon>code</FontIcon>}
          primaryText='Modifiers'
        />
      </a>,
      <a href='#/domains'>
        <ListItem
          leftIcon={<FontIcon>domain</FontIcon>}
          primaryText='Domains'
        />
      </a>,

      <Divider />,

      <ListItem
        leftIcon={<FontIcon>account_box</FontIcon>}
        primaryText='My Account'
        nestedItems={[
          !window.cordova ? (
            <a href='#/account'>
              <ListItem
                leftIcon={<FontIcon>account_circle</FontIcon>}
                primaryText='Manage'
              />
            </a>
          ) : <a />,
          <a href='#/account/primary-emails'>
            <ListItem
              leftIcon={<FontIcon>email</FontIcon>}
              primaryText='Primary Emails'
            />
          </a>,
          <ListItem
            onClick={() => this.onLogout()}
            leftIcon={<FontIcon>close</FontIcon>}
            primaryText='Logout'
          />
        ]}
      />,

      <ListItem
        leftIcon={<FontIcon>info</FontIcon>}
        primaryText='Documentation'
        nestedItems={[
          <a href='#/docs/help'>
            <ListItem
              leftIcon={<FontIcon>help</FontIcon>}
              primaryText='Help'
            />
          </a>,
          <a href='#/docs/privacy'>
            <ListItem
              leftIcon={<FontIcon>security</FontIcon>}
              primaryText='Privacy Policy'
            />
          </a>,
          <a href='#/docs/tos'>
            <ListItem
              leftIcon={<FontIcon>gavel</FontIcon>}
              primaryText='Terms of Service'
            />
          </a>
        ]}
      />
    ];
  }

  render() {
    const {App} = this.props;

    return (
      <React.Fragment>
        <Toolbar
          colored fixed
          actions={[
            <Button
              icon
              iconChildren='search'
              onClick={() => location.hash = '#/emails/list'}
            />,
            <Button
              icon
              iconChildren='add'
              onClick={() => location.hash = '#/emails/create'}
            />
          ]}
          title='Ptorx'
          nav={
            <Button
              icon
              iconChildren='menu'
              onClick={() => this.setState({ drawer: true })}
            />
          }
        />

        <Drawer
          onVisibilityChange={v => this.setState({ drawer: v })}
          autoclose={true}
          navItems={this._renderDrawerNavItems()}
          visible={this.state.drawer}
          header={
            <Toolbar
              colored
              nav={
                <Button
                  icon
                  onClick={() => this.setState({ drawer: false })}
                  iconChildren='arrow_back'
                />
              }
            />
          }
          type={Drawer.DrawerTypes.TEMPORARY}
        />
      </React.Fragment>
    )
  }

}