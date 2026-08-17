re # TODO

## Step 1: Root-cause signin/upload failure
- [ ] Inspect backend upload/auth endpoints and required auth headers
- [ ] Inspect frontend token usage during login and upload
- [ ] Add better frontend error surfacing (status + body)

## Step 2: Implement fix
- [ ] Adjust frontend token handling and/or request headers
- [ ] Adjust backend auth dependency if needed
- [ ] Validate upload multipart handling

## Step 3: Test
- [ ] Start backend + frontend
- [ ] Implement premium dashboard shell: collapsible sidebar + top navbar
- [ ] Add breadcrumb and active route highlighting
- [ ] Add global search/notifications/user dropdown placeholders
