import React from 'react';

export default class FusionAlertContent extends React.Component {
  render() {
    const content =
      'To perform image fusion, plase select a two-column layout, and then select PET and CT type images (same series) for the left and right columns.';

    return <div>{content}</div>;
  }
}
