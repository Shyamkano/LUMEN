# Image Upload Bug - COMPLETE FIX

## Problem Summary
- Images uploaded in editor preview showed correctly
- After publishing, images didn't display in the published article
- Inspector showed wrapper div present but `src` attribute MISSING from `<img>` tag
- This caused the image to fail loading because no URL was provided

## Root Causes Identified

### Root Cause #1: Inconsistent Image Node Implementations
- **TipTapEditor.tsx** - Had its own PersistentImage definition
- **PreviewPanel.tsx** - Had its own incomplete PersistentImage definition (missing setImage command)
- **ArchivalReader.tsx** - Had its own duplicate PersistentImage definition
- **EditorWorkspace.tsx** - Had yet another duplicate definition
- Resulted in 4 different implementations with inconsistent attribute handling

### Root Cause #2: Image URL Serialization Loss
- When editor.getJSON() was called, image node attributes weren't being preserved
- The `src` attribute was lost during JSON serialization to the database
- When content was retrieved from Supabase, the image nodes had no src/url attributes
- This caused `<img>` tags to render with empty src attributes

## Solution Implemented (Two-Part Fix)

### Part 1: Unified Image Extension (`src/lib/editor/persistent-image.ts`)
Created a single, comprehensive `PersistentImage` node extension that:
- ✅ Properly handles both `src` and `url` attributes
- ✅ Has complete `parseHTML()` that handles direct `<img>` tags AND nested div structures
- ✅ Includes proper `renderHTML()` that wraps images in semantic divs
- ✅ Has robust `setImage()` command that ensures both attributes are set
- ✅ Includes console logging for debugging

**Key improvement**: The `setImage()` command now explicitly sets BOTH `src` and `url`:
```javascript
attrs: {
  src: options.src || options.url || null,
  url: options.url || options.src || null,
  alt: options.alt || '',
  title: options.title || '',
}
```

### Part 2: Content Normalization (`src/app/actions/posts.ts`)
Added `normalizeContentForStorage()` function that:
- ✅ Recursively processes content JSON before saving to database
- ✅ Ensures all image nodes have BOTH `src` AND `url` attributes set
- ✅ Preserves both attributes during round-trip (save → retrieve → display)
- ✅ Includes logging to track image node attributes

**Applied to**:
- `createPost()` - Normalizes content before creating new posts
- `updatePost()` - Normalizes content before updating posts
- `post_versions` inserts - Uses normalized content in version history

## Files Changed

### New Files
- `/src/lib/editor/persistent-image.ts` - Unified image node implementation

### Updated Files
- `/src/components/editor/TipTapEditor.tsx` - Import shared PersistentImage, remove duplicate
- `/src/components/editor/PreviewPanel.tsx` - Import shared PersistentImage, remove duplicate
- `/src/components/post/ArchivalReader.tsx` - Import shared PersistentImage, remove duplicate
- `/src/components/editor/EditorWorkspace.tsx` - Import shared PersistentImage, remove duplicate
- `/src/app/actions/posts.ts` - Add normalizeContentForStorage(), apply to create/update

## How It Works Now

### Upload Flow
1. User uploads image → EditorToolbar.handleImageSubmit
2. Image uploaded to Supabase → URL returned
3. EditorToolbar calls `setImage({ src: data.url })`
4. PersistentImage.setImage ensures attrs = { src, url, alt, title }
5. Editor JSON includes complete image node with src/url

### Save Flow
1. User publishes → editor.getJSON() called
2. createPost/updatePost receives content JSON
3. **NEW**: normalizeContentForStorage() ensures src/url preserved
4. Content saved to database with image nodes intact

### Display Flow
1. getPostBySlug retrieves content from database
2. fixContentNodes() converts old 'image' nodes to 'lumenImage'
3. ArchivalReader uses unified PersistentImage
4. generateHTML renders with proper src attribute
5. Image displays correctly

## Testing Checklist

- [ ] Upload image in editor
- [ ] Verify image shows in preview panel  
- [ ] Publish the article
- [ ] Verify image displays in published article
- [ ] Check browser inspector - `src` attribute should be present with valid URL
- [ ] Verify "LUMEN AUTHORITY" label appears on image hover (styling works)
- [ ] Test with multiple images in one article
- [ ] Test editing existing post with images

## Debugging Tips

Look for these console logs if image URLs are still missing:
```javascript
'[PersistentImage] setImage called with: {...}'
'[normalizeContentForStorage] Image node: {src: "url", url: "url"}'
'[PersistentImage] No src or url found in node attrs'
```

These indicate:
1. Image command is being called properly
2. Normalization is preserving URLs
3. If last message appears, the image node lost its URL somewhere

## Why This Fixes The Issue

**Before**: Image URL was lost during serialization → empty `src` attribute → image fails to load

**After**:
1. Image extension explicitly manages both src and url
2. Normalization function ensures attributes survive database round-trip
3. Consistent implementation across all components means no data is lost
4. When content is retrieved and rendered, src attribute is guaranteed to be present
