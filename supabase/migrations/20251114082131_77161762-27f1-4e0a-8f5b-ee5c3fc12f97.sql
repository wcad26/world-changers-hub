-- Allow public to create profiles for visitors (without auth)
CREATE POLICY "Public can create visitor profiles"
  ON profiles FOR INSERT
  TO public
  WITH CHECK (id IS NOT NULL);

-- Allow public to insert visitor member records
CREATE POLICY "Public can register as visitors"
  ON members FOR INSERT
  TO public
  WITH CHECK (member_type = 'visitor');