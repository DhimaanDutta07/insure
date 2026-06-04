# -*- coding: utf-8 -*-
import re

# Read the file
with open('PolicyView1.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the handleViewDocument function to add fallback for relative_path
content = content.replace(
    '''  // Handle document preview - uses only documentService (no fallbacks)
  const handleViewDocument = async (doc: PolicyDocument) => {
    if (!doc.id) {
      console.error("Document ID is missing:", doc);
      return;
    }

    try {
      console.log("Fetching document URL for:", doc.id);

      const url = await documentService.getCachedDocumentUrl(doc.id);

      if (url) {
        setPreviewDoc({
          url,
          name: doc.original_name || doc.file_name || 'Document',
          type: getFileExtension(doc.original_name || doc.file_name)
        });
        setModalOpen(true);
      } else {
        console.error("Could not get document URL for:", doc);
        // No fallbacks - rely entirely on backend service
      }
    } catch (error) {
      console.error("Error fetching document URL:", error);
      // No fallbacks - rely entirely on backend service
    }
  };''',
    '''  // Handle document preview - uses documentService with fallback
  const handleViewDocument = async (doc: PolicyDocument) => {
    if (!doc.id) {
      console.error("Document ID is missing:", doc);
      return;
    }

    try {
      console.log("Fetching document URL for:", doc.id);

      const url = await documentService.getCachedDocumentUrl(doc.id);

      if (url) {
        setPreviewDoc({
          url,
          name: doc.original_name || doc.file_name || 'Document',
          type: getFileExtension(doc.original_name || doc.file_name)
        });
        setModalOpen(true);
      } else {
        console.error("Could not get document URL from service, trying fallback");
        // Fallback: construct URL directly from relative_path
        if (doc.relative_path) {
          const fallbackUrl = documentService.constructDirectUrl(doc.relative_path);
          console.log("Using fallback URL:", fallbackUrl);
          setPreviewDoc({
            url: fallbackUrl,
            name: doc.original_name || doc.file_name || 'Document',
            type: getFileExtension(doc.original_name || doc.file_name)
          });
          setModalOpen(true);
        } else {
          console.error("No relative_path available for fallback");
          alert("Could not load document");
        }
      }
    } catch (error) {
      console.error("Error fetching document URL:", error);
      // Fallback: construct URL directly from relative_path
      if (doc.relative_path) {
        const fallbackUrl = documentService.constructDirectUrl(doc.relative_path);
        console.log("Using fallback URL from error handler:", fallbackUrl);
        setPreviewDoc({
          url: fallbackUrl,
          name: doc.original_name || doc.file_name || 'Document',
          type: getFileExtension(doc.original_name || doc.file_name)
        });
        setModalOpen(true);
      } else {
        alert("Could not load document");
      }
    }
  };'''
)

# Write the file
with open('PolicyView1.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('File updated successfully')
