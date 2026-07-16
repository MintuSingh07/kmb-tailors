export const CATEGORY_GROUPS = {
  "Suits": [
    "Punjabi Suit",
    "Patiala Suit",
    "Salwar Kameez",
    "Churidar Suit",
    "Straight Cut Suit",
    "A-Line Suit",
    "Anarkali Suit",
    "Floor-Length Anarkali",
    "Umbrella Anarkali",
    "Frock Style Suit",
    "Angrakha Suit",
    "Sharara Suit",
    "Gharara Suit",
    "Palazzo Suit",
    "Pant Style Suit",
    "Cigarette Pant Suit",
    "Parallel Suit",
    "Tulip Pant Suit",
    "Dhoti Style Suit",
    "Afghani Suit",
    "Pakistani Suit",
    "Pakistani Lawn Suit",
    "Cape Style Suit",
    "Jacket Style Suit",
    "Peplum Suit",
    "Front Slit Suit",
    "High-Low Suit",
    "Kaftan Suit",
    "Indo-Western Suit",
    "Cotton Suit",
    "Silk Suit",
    "Linen Suit",
    "Velvet Suit",
    "Georgette Suit",
    "Chiffon Suit",
    "Organza Suit",
    "Banarasi Suit",
    "Bandhani Suit",
    "Chikankari Suit",
    "Phulkari Suit",
    "Mirror Work Suit",
    "Party Wear Suit",
    "Bridal Suit",
    "Designer Suit",
    "Casual Suit",
    "Office Wear Suit",
    "Festive Suit"
  ],
  "Sarees": [
    "Banarasi Saree",
    "Kanjeevaram Saree",
    "Mysore Silk Saree",
    "Paithani Saree",
    "Patola Saree",
    "Bandhani Saree",
    "Chanderi Saree",
    "Maheshwari Saree",
    "Tant Saree",
    "Jamdani Saree",
    "Sambalpuri Saree",
    "Kota Doria Saree",
    "Linen Saree",
    "Cotton Saree",
    "Silk Saree",
    "Organza Saree",
    "Tissue Saree",
    "Chiffon Saree",
    "Georgette Saree",
    "Net Saree",
    "Crepe Saree",
    "Satin Saree",
    "Printed Saree",
    "Embroidered Saree",
    "Sequins Saree",
    "Mirror Work Saree",
    "Bridal Saree",
    "Designer Saree",
    "Half & Half Saree",
    "Ruffle Saree",
    "Ready-to-Wear Saree",
    "Lehenga Saree",
    "Dhoti Saree",
    "Party Wear Saree"
  ],
  "Dresses": [
    "A-Line Dress",
    "Maxi Dress",
    "Midi Dress",
    "Mini Dress",
    "Bodycon Dress",
    "Fit & Flare Dress",
    "Wrap Dress",
    "Shift Dress",
    "Shirt Dress",
    "Empire Waist Dress",
    "Peplum Dress",
    "High-Low Dress",
    "Off-Shoulder Dress",
    "One Shoulder Dress",
    "Cold Shoulder Dress",
    "Halter Neck Dress",
    "Tube Dress",
    "Strap Dress",
    "Floral Dress",
    "Printed Dress",
    "Party Dress",
    "Cocktail Dress",
    "Evening Gown",
    "Ball Gown",
    "Casual Dress",
    "Summer Dress",
    "Denim Dress",
    "Velvet Dress",
    "Satin Dress",
    "Kaftan Dress",
    "Tunic Dress",
    "Tiered Dress"
  ],
  "Kurtis & Kurtas": [
    "Straight Kurti",
    "A-Line Kurti",
    "Anarkali Kurti",
    "High-Low Kurti",
    "Angrakha Kurti",
    "Asymmetrical Kurti",
    "Front Slit Kurti",
    "Jacket Kurti",
    "Kaftan Kurti",
    "Long Kurti",
    "Short Kurti",
    "Printed Kurti",
    "Chikankari Kurti",
    "Cotton Kurti",
    "Designer Kurti"
  ],
  "Lehengas": [
    "Bridal Lehenga",
    "Party Wear Lehenga",
    "Designer Lehenga",
    "A-Line Lehenga",
    "Circular Lehenga",
    "Mermaid Lehenga",
    "Panelled Lehenga",
    "Jacket Lehenga",
    "Indo-Western Lehenga",
    "Printed Lehenga",
    "Banarasi Lehenga",
    "Velvet Lehenga",
    "Silk Lehenga"
  ],
  "Blouses": [
    "Princess Cut Blouse",
    "Boat Neck Blouse",
    "V-Neck Blouse",
    "Collar Blouse",
    "Puff Sleeve Blouse",
    "Sleeveless Blouse",
    "Backless Blouse",
    "Halter Blouse",
    "High Neck Blouse",
    "Jacket Style Blouse",
    "Bridal Blouse",
    "Designer Blouse"
  ],
  "Bottom Wear": [
    "Salwar",
    "Churidar",
    "Patiala",
    "Palazzo",
    "Cigarette Pants",
    "Straight Pants",
    "Tulip Pants",
    "Dhoti Pants",
    "Parallel Pants",
    "Leggings",
    "Jeggings",
    "Sharara",
    "Gharara",
    "Skirt"
  ]
};

export type CategoryGroup = keyof typeof CATEGORY_GROUPS;

export const ALL_CATEGORIES = Object.values(CATEGORY_GROUPS).flat();

export function getGroupForCategory(category: string): CategoryGroup | "Other" {
  if (!category) return "Other";
  
  // Exact match first
  for (const [group, list] of Object.entries(CATEGORY_GROUPS)) {
    if (list.includes(category)) {
      return group as CategoryGroup;
    }
  }

  // Fallback heuristic based on keywords
  const c = category.toLowerCase();
  if (c.includes("suit")) return "Suits";
  if (c.includes("saree")) return "Sarees";
  if (c.includes("dress") || c.includes("gown")) return "Dresses";
  if (c.includes("kurti") || c.includes("kurta")) return "Kurtis & Kurtas";
  if (c.includes("lehenga")) return "Lehengas";
  if (c.includes("blouse")) return "Blouses";
  
  const bottomKeywords = [
    "salwar", "churidar", "patiala", "palazzo", "pants", "leggings", "jeggings", "sharara", "gharara", "skirt"
  ];
  if (bottomKeywords.some(kw => c.includes(kw))) {
    return "Bottom Wear";
  }

  return "Other";
}
