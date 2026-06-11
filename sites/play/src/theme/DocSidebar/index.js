// src/theme/DocSidebar/index.js

import React from 'react';
import { useLocation } from '@docusaurus/router';
import OriginalDocSidebar from '@theme-original/DocSidebar';

// Helper function to check the URL
function isEmbeddedInMoodle(search) {
  const params = new URLSearchParams(search);
  return params.get('embedded') === 'moodle';
}

export default function DocSidebarWrapper(props) {
  const { search } = useLocation();

  // If the URL parameter is present, return null to hide the sidebar
  if (isEmbeddedInMoodle(search)) {
    console.log('moodle embedded')
    return null;
  }

  console.log('not embedded')

  // Otherwise, render the original sidebar as normal
  return <OriginalDocSidebar {...props} />;
}