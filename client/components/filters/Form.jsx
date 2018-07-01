import PropTypes from 'prop-types';
import React from 'react';

// react-md
import SelectField from 'react-md/lib/SelectFields';
import TextField from 'react-md/lib/TextFields';
import Checkbox from 'react-md/lib/SelectionControls/Checkbox';
import Button from 'react-md/lib/Buttons/Button';
import Paper from 'react-md/lib/Papers';

// Constants
import { filterTypes } from 'constants/types';

export default class FilterForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = { type: this.props.filter.type };
  }

  onSubmit() {
    const data = {
      type: this.state.type,
      name: this.refs.name.value,
      useRegex: window['checkbox--regex'].checked,
      description: this.refs.description.value,
      acceptOnMatch: window['checkbox--accept-on-match'].checked
    };

    // Only header filters have different values than others
    if (data.type == 6) {
      data.find =
        this.refs.headerName.value + ':::' + this.refs.headerValue.value;
    } else {
      data.find = this.refs.find.value;
    }

    this.props.onSubmit(data);
  }

  render() {
    const { filter } = this.props;

    let form;
    if (this.state.type == 6) {
      const find = filter.find.split(':::');
      form = (
        <div className="header-filter flex">
          <TextField
            id="text--header-name"
            ref="headerName"
            type="text"
            label="Header Name"
            helpText="The header to look for; cannot be a regular expression"
            defaultValue={find[0]}
          />

          <TextField
            id="text--header-value"
            ref="headerValue"
            type="text"
            label="Header Value"
            helpText="The value within the header value to look for"
            defaultValue={find[1]}
          />
        </div>
      );
    } else {
      form = (
        <TextField
          id="text--find"
          ref="find"
          type="text"
          label="Find"
          helpText="The value to search for in an email"
          defaultValue={filter.find}
        />
      );
    }

    return (
      <div className="filter-form">
        <Paper zDepth={1} component="section" className="section flex">
          <SelectField
            id="select--type"
            label="Filter Type"
            value={this.state.type}
            onChange={type => this.setState({ type })}
            position={SelectField.Positions.BELOW}
            className="md-full-width"
            menuItems={Object.keys(filterTypes).map(k =>
              Object({ label: filterTypes[k], value: +k })
            )}
          />

          <TextField
            id="text--name"
            ref="name"
            type="text"
            label="Name"
            defaultValue={filter.name}
          />

          <TextField
            id="text--description"
            ref="description"
            type="text"
            label="Description"
            defaultValue={filter.description}
          />

          <Checkbox
            id="checkbox--accept-on-match"
            label="Accept on Match"
            defaultChecked={filter.acceptOnMatch}
          />

          {form}

          <Checkbox
            id="checkbox--regex"
            label="Regular Expression"
            defaultChecked={filter.regex}
          />

          <Button primary raised onClick={() => this.onSubmit()}>
            Submit
          </Button>
        </Paper>

        {filter.linkedTo.length ? (
          <Paper
            zDepth={1}
            component="section"
            className="linked-emails section flex"
          >
            <h3>Linked To</h3>
            <p>Below are emails that are currently utilizing this filter.</p>

            <div className="linked-emails">
              {filter.linkedTo.map(email => (
                <a key={email.id} href={`#/emails/edit/${email.id}`}>
                  {email.address}
                </a>
              ))}
            </div>
          </Paper>
        ) : null}
      </div>
    );
  }
}

FilterForm.propTypes = {
  filter: PropTypes.objectOf(
    PropTypes.any /*{
    type: PropTypes.number,
    name: PropTypes.string,
    find: PropTypes.string,
    regex: PropTypes.bool,
    linkedTo: PropTypes.arrayOf(
      PropTypes.objectOf({
        id: PropTypes.number, address: PropTypes.string
      })
    ),
    description: PropTypes.string,
    acceptOnMatch: PropTypes.bool
  }*/
  ),
  onSubmit: PropTypes.func.isRequired
};

FilterForm.defaultProps = {
  filter: {
    type: 0,
    find: '',
    name: '',
    regex: false,
    linkedTo: [],
    description: '',
    acceptOnMatch: true
  }
};
