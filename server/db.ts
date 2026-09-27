import { CivicIssue, DuplicateCheckResult, PriorityEvaluation, CityAnalytics, IssueCategory, IssuePriority, IssueStatus } from '../src/types/index.ts';

// Haversine distance formula in meters
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const radLat1 = (lat1 * Math.PI) / 180;
  const radLat2 = (lat2 * Math.PI) / 180;
  const deltaLat = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) * Math.cos(radLat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Generate human-friendly short tracking ID e.g. CP-7A29F
export function generateTrackingId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'CP-';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Deterministic Priority Engine with clear transparency rules
export function evaluatePriority(
  category: IssueCategory,
  description: string,
  title: string,
  lat: number,
  lng: number,
  existingIssues: CivicIssue[]
): PriorityEvaluation {
  const content = (title + ' ' + description).toLowerCase();
  const reasons: string[] = [];
  let score = 20; // default baseline (Low)

  // 1. Hazard keyword analysis
  const criticalKeywords = ['sparking', 'exposed wire', 'sinkhole', 'gas leak', 'gushing', 'burst main', 'fire hazard', 'electrocution', 'collapsed'];
  const highKeywords = ['deep pothole', 'flooding', 'school zone', 'hospital', 'crosswalk', 'major arterial', 'traffic blind', 'total blackout', 'elderly'];
  const mediumKeywords = ['cracked', 'dumping', 'overflowing', 'flickering', 'clogged', 'odorous', 'puddle', 'sidewalk'];

  const matchedCritical = criticalKeywords.filter(k => content.includes(k));
  const matchedHigh = highKeywords.filter(k => content.includes(k));
  const matchedMedium = mediumKeywords.filter(k => content.includes(k));

  if (matchedCritical.length > 0) {
    score += 50;
    reasons.push(`Critical safety hazard keyword detected: "${matchedCritical[0]}"`);
  } else if (matchedHigh.length > 0) {
    score += 30;
    reasons.push(`High urgency impact detected: "${matchedHigh[0]}"`);
  } else if (matchedMedium.length > 0) {
    score += 15;
    reasons.push(`Noticeable structural wear: "${matchedMedium[0]}"`);
  }

  // 2. Category baseline weighting
  if (category === 'water' || category === 'drainage') {
    score += 15;
    reasons.push(`Category baseline: Water & flood risks have elevated municipal priority`);
  } else if (category === 'streetlight') {
    if (content.includes('dark') || content.includes('night')) {
      score += 15;
      reasons.push(`Public safety baseline: Pedestrian visibility hazard`);
    }
  }

  // 3. Proximity cluster detection (reports of same category within 500m)
  const nearbyReports = existingIssues.filter(issue => {
    if (issue.status === 'Resolved') return false;
    if (issue.category !== category) return false;
    const dist = calculateDistanceMeters(lat, lng, issue.location.lat, issue.location.lng);
    return dist <= 500;
  });

  if (nearbyReports.length >= 2) {
    score += 25;
    reasons.push(`Proximity Cluster: ${nearbyReports.length} similar active reports within 500m`);
  } else if (nearbyReports.length === 1) {
    score += 10;
    reasons.push(`Area recurrence: 1 adjacent active report within 500m`);
  }

  // Final deterministic classification
  let priority: IssuePriority = 'Low';
  if (score >= 65) {
    priority = 'Critical';
  } else if (score >= 45) {
    priority = 'High';
  } else if (score >= 30) {
    priority = 'Medium';
  } else {
    priority = 'Low';
    if (reasons.length === 0) {
      reasons.push('Standard non-hazardous routine maintenance request');
    }
  }

  return {
    priority,
    score,
    reasons,
    nearbySimilarCount: nearbyReports.length,
  };
}

// Check for duplicate issues within 300 meters of the same category
export function checkDuplicate(
  category: IssueCategory,
  lat: number,
  lng: number,
  existingIssues: CivicIssue[]
): DuplicateCheckResult {
  const activeSameCategory = existingIssues.filter(
    issue => issue.status !== 'Resolved' && issue.category === category
  );

  let closestIssue: CivicIssue | null = null;
  let minDistance = Infinity;

  for (const issue of activeSameCategory) {
    const dist = calculateDistanceMeters(lat, lng, issue.location.lat, issue.location.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closestIssue = issue;
    }
  }

  // Threshold: 300 meters
  if (closestIssue && minDistance <= 300) {
    return {
      isDuplicate: true,
      distanceMeters: minDistance,
      existingIssue: closestIssue,
      reason: `An active ${category} issue "${closestIssue.title}" (${closestIssue.trackingId}) was reported ${minDistance}m away.`,
    };
  }

  return {
    isDuplicate: false,
    distanceMeters: minDistance === Infinity ? 0 : minDistance,
  };
}

export function getDepartmentForCategory(category: IssueCategory): string {
  switch (category) {
    case 'road':
    case 'footpath':
      return 'Department of Public Works';
    case 'streetlight':
      return 'City Power & Lighting Grid';
    case 'waste':
      return 'Waste Management & Sanitation';
    case 'water':
    case 'drainage':
      return 'Municipal Water & Sewer Authority';
    case 'traffic':
      return 'Bureau of Traffic Management';
    case 'parks':
      return 'Parks & Urban Forestry Division';
    default:
      return 'Department of Public Works';
  }
}

// 36 realistic seed issues across Austin downtown / central core
export function createSeedIssues(): CivicIssue[] {
  const now = Date.now();
  const h = (hoursAgo: number) => new Date(now - hoursAgo * 3600 * 1000).toISOString();

  return [
    {
      id: 'iss-01',
      trackingId: 'CP-7A29F',
      title: 'Deep axle-breaking pothole near pedestrian crosswalk',
      description: 'Extremely deep pothole in the right lane right before the pedestrian crosswalk. Cars are swerving abruptly into oncoming bike lane. Multiple cars bottoming out.',
      category: 'road',
      priority: 'Critical',
      priorityReasoning: [
        'Critical safety hazard: Traffic swerving into adjacent bike lane',
        'High impact arterial corridor at Congress Ave',
        'Proximity Cluster: 2 similar active road issues within 400m'
      ],
      status: 'In Progress',
      location: {
        lat: 30.2685,
        lng: -97.7428,
        address: '601 Congress Ave, Downtown Austin',
        neighborhood: 'Downtown Arts District'
      },
      photoUrl: '/src/assets/images/civic_pothole_street_1790358903775.jpg',
      department: 'Department of Public Works',
      assignedCrew: 'Road Maintenance Crew #3 (Foreman R. Alvarez)',
      createdAt: h(18),
      updatedAt: h(2),
      upvotes: 14,
      timeline: [
        {
          id: 'tl-1',
          status: 'Reported',
          title: 'Citizen Report Filed',
          timestamp: h(18),
          remark: 'Automated ingestion via mobile web portal. High priority flagged.',
          actor: 'Citizen #8942'
        },
        {
          id: 'tl-2',
          status: 'Verified',
          title: 'Location & Hazard Verified',
          timestamp: h(16),
          remark: 'Inspector verified severe asphalt deformation measuring 8 inches deep.',
          actor: 'Dispatcher M. Henderson'
        },
        {
          id: 'tl-3',
          status: 'Assigned',
          title: 'Work Order Dispatched',
          timestamp: h(12),
          remark: 'Dispatched to Asphalt Rapid Response Crew #3 with hot-mix patch unit.',
          actor: 'Public Works Dispatch'
        },
        {
          id: 'tl-4',
          status: 'In Progress',
          title: 'Crew On-Site',
          timestamp: h(2),
          remark: 'Lane closure cones deployed. Milling jagged perimeter before hot asphalt compaction.',
          actor: 'Foreman R. Alvarez'
        }
      ]
    },
    {
      id: 'iss-02',
      trackingId: 'CP-93K12',
      title: 'Water main fracture gushing onto roadway and curb',
      description: 'Clean municipal water bubbling up violently through sidewalk joints and flooding the lower roadway curb. Water pressure dropping in surrounding cafes.',
      category: 'water',
      priority: 'Critical',
      priorityReasoning: [
        'Critical safety hazard keyword: "gushing water main"',
        'Category baseline: Underground pressurized main failure risk',
        'Potential foundation scouring underneath roadway'
      ],
      status: 'Assigned',
      location: {
        lat: 30.2642,
        lng: -97.7495,
        address: '320 W 2nd St, 2nd Street District',
        neighborhood: 'Warehouse District'
      },
      photoUrl: '/src/assets/images/civic_water_leak_street_1790358929673.jpg',
      department: 'Municipal Water & Sewer Authority',
      assignedCrew: 'Emergency Utilities Response Unit #7',
      createdAt: h(6),
      updatedAt: h(3),
      upvotes: 27,
      timeline: [
        {
          id: 'tl-20',
          status: 'Reported',
          title: 'Citizen Report Logged',
          timestamp: h(6),
          remark: 'Multiple resident calls cross-referenced. Automated priority escalated.',
          actor: 'Citizen #1024'
        },
        {
          id: 'tl-21',
          status: 'Verified',
          title: 'Pressure Anomaly Confirmed',
          timestamp: h(5),
          remark: 'Supervisory Control and Data Acquisition (SCADA) telemetry confirms 12psi localized drop on Zone 4 main.',
          actor: 'SCADA Operations Desk'
        },
        {
          id: 'tl-22',
          status: 'Assigned',
          title: 'Valve Isolation Unit Dispatched',
          timestamp: h(3),
          remark: 'Field technicians en route to close gate valve #B-402 and locate rupture.',
          actor: 'Water Authority Dispatch'
        }
      ]
    },
    {
      id: 'iss-03',
      trackingId: 'CP-4F81A',
      title: 'Streetlight array blackout causing complete nighttime darkness',
      description: 'Three consecutive high-mast streetlights are completely dead along the sidewalk between 8th and 9th. Pedestrians using phone flashlights, severe safety concern.',
      category: 'streetlight',
      priority: 'High',
      priorityReasoning: [
        'High urgency: Total blackout across 3 fixtures',
        'Pedestrian safety vulnerability during peak evening hours',
        'Proximity Cluster: Adjacent to late-night transit corridor'
      ],
      status: 'Verified',
      location: {
        lat: 30.2711,
        lng: -97.7412,
        address: '815 Brazos St, Downtown',
        neighborhood: 'Capitol District'
      },
      photoUrl: '/src/assets/images/civic_broken_streetlight_1790358917214.jpg',
      department: 'City Power & Lighting Grid',
      assignedCrew: 'Grid Maintenance Bucket Unit #2',
      createdAt: h(28),
      updatedAt: h(14),
      upvotes: 9,
      timeline: [
        {
          id: 'tl-30',
          status: 'Reported',
          title: 'Issue Logged by Resident',
          timestamp: h(28),
          remark: 'Reported via web portal with photo of non-functional lamp head.',
          actor: 'Citizen #4411'
        },
        {
          id: 'tl-31',
          status: 'Verified',
          title: 'Circuit Telemetry Triaged',
          timestamp: h(14),
          remark: 'Remote diagnostic showed blown 40A fuse on branch circuit #BR-09.',
          actor: 'Grid Operations Center'
        }
      ]
    },
    {
      id: 'iss-04',
      trackingId: 'CP-1B90E',
      title: 'Illegal commercial dumping of construction drywall & debris',
      description: 'Large pile of demolished drywall, rusty nails, and plastic insulation dumped overnight in alleyway blocking commercial delivery access and sanitation dumpsters.',
      category: 'waste',
      priority: 'Medium',
      priorityReasoning: [
        'Obstruction of municipal right-of-way alley',
        'Sharp debris (exposed nails) poses tire and foot hazard'
      ],
      status: 'Reported',
      location: {
        lat: 30.2638,
        lng: -97.7374,
        address: '74 Rainey St Alley, Rainey Historic District',
        neighborhood: 'Rainey District'
      },
      department: 'Waste Management & Sanitation',
      createdAt: h(4),
      updatedAt: h(4),
      upvotes: 6,
      timeline: [
        {
          id: 'tl-40',
          status: 'Reported',
          title: 'Citizen Report Filed',
          timestamp: h(4),
          remark: 'Report received with photo evidence. Pending queue verification.',
          actor: 'Citizen #3819'
        }
      ]
    },
    {
      id: 'iss-05',
      trackingId: 'CP-8E32D',
      title: 'Clogged storm drain inlet with heavy leaf buildup and standing water',
      description: 'Storm sewer grate is 100% blocked with decayed branches and sediment. Water is backing up over the sidewalk after yesterday’s light rain.',
      category: 'drainage',
      priority: 'High',
      priorityReasoning: [
        'Category baseline: Flooding hazard near storefront doors',
        'Upcoming rain forecast elevates priority level'
      ],
      status: 'Resolved',
      location: {
        lat: 30.2698,
        lng: -97.7472,
        address: '400 W 5th St, Market District',
        neighborhood: 'Downtown'
      },
      department: 'Municipal Water & Sewer Authority',
      assignedCrew: 'Stormwater Vac-Truck Crew #1',
      createdAt: h(52),
      updatedAt: h(8),
      resolvedAt: h(8),
      upvotes: 11,
      timeline: [
        {
          id: 'tl-50',
          status: 'Reported',
          title: 'Citizen Report Filed',
          timestamp: h(52),
          actor: 'Citizen #7712'
        },
        {
          id: 'tl-51',
          status: 'Verified',
          title: 'Inspected by Stormwater Team',
          timestamp: h(40),
          remark: 'Inlet basin clogged with heavy vegetative debris.',
          actor: 'Inspector D. Patel'
        },
        {
          id: 'tl-52',
          status: 'In Progress',
          title: 'Vactor Unit Dispatched',
          timestamp: h(12),
          remark: 'Industrial hydro-vacuuming and catch basin flush in progress.',
          actor: 'Vac-Truck Unit #1'
        },
        {
          id: 'tl-53',
          status: 'Resolved',
          title: 'Drain Cleared & Flow Restored',
          timestamp: h(8),
          remark: 'Grate cleared, 180 lbs of sludge removed. Storm sewer flow nominal.',
          actor: 'Supervisor K. Walsh'
        }
      ]
    },
    {
      id: 'iss-06',
      trackingId: 'CP-5C67X',
      title: 'Severely buckled sidewalk slab caused by tree root intrusion',
      description: 'Concrete sidewalk slab lifted over 3.5 inches above grade, creating a severe tripping hazard for seniors and blocking wheelchair accessibility.',
      category: 'footpath',
      priority: 'High',
      priorityReasoning: [
        'ADA compliance violation: Exceeds 0.25 inch vertical trip threshold',
        'Senior foot traffic zone near medical offices'
      ],
      status: 'Assigned',
      location: {
        lat: 30.2745,
        lng: -97.7441,
        address: '1100 Lavaca St, Civic Center',
        neighborhood: 'State Capitol Area'
      },
      department: 'Department of Public Works',
      assignedCrew: 'Sidewalk Repair & Concrete Team B',
      createdAt: h(36),
      updatedAt: h(10),
      upvotes: 19,
      timeline: [
        {
          id: 'tl-60',
          status: 'Reported',
          title: 'Citizen Report Filed',
          timestamp: h(36),
          actor: 'Citizen #9910'
        },
        {
          id: 'tl-61',
          status: 'Verified',
          title: 'Physical Survey Completed',
          timestamp: h(24),
          remark: 'Marked with safety orange high-visibility chalk. Root barrier required.',
          actor: 'Inspector T. Evans'
        },
        {
          id: 'tl-62',
          status: 'Assigned',
          title: 'Concrete Slicing Crew Scheduled',
          timestamp: h(10),
          remark: 'Scheduled for horizontal precision saw-cutting to eliminate vertical ledge.',
          actor: 'Public Works Dispatch'
        }
      ]
    },
    {
      id: 'iss-07',
      trackingId: 'CP-3Z21M',
      title: 'Traffic signal stuck on flashing red in all directions',
      description: 'Major intersection signal controller faulted to all-red flashing mode. Massive vehicle backup in all 4 directions during morning commute.',
      category: 'traffic',
      priority: 'Critical',
      priorityReasoning: [
        'Critical safety hazard: Major 4-way intersection gridlock',
        'Emergency response vehicle route obstructed'
      ],
      status: 'In Progress',
      location: {
        lat: 30.2662,
        lng: -97.7345,
        address: 'East 7th St & Red River St',
        neighborhood: 'East Downtown'
      },
      department: 'Bureau of Traffic Management',
      assignedCrew: 'Signal Electronics Emergency Unit #1',
      createdAt: h(3),
      updatedAt: h(1),
      upvotes: 35,
      timeline: [
        {
          id: 'tl-70',
          status: 'Reported',
          title: 'Multiple Motorist Alerts',
          timestamp: h(3),
          remark: 'Immediate escalation triggered by 5 simultaneous reports in 10 minutes.',
          actor: 'Automated Dispatch'
        },
        {
          id: 'tl-71',
          status: 'In Progress',
          title: 'Technician on Signal Cabinet',
          timestamp: h(1),
          remark: 'Cabinet MMU (Malfunction Management Unit) triggered by surge. Rebooting controller.',
          actor: 'Signal Tech L. Zhang'
        }
      ]
    },
    {
      id: 'iss-08',
      trackingId: 'CP-2Y55Q',
      title: 'Large fallen tree branch obstructing park walking trail',
      description: 'Heavy heritage oak limb snapped during high winds. Spanning entire 12-foot decomposed granite trail. Cyclists forced into mud.',
      category: 'parks',
      priority: 'Medium',
      priorityReasoning: [
        'Trail blockage in high-use municipal recreational park'
      ],
      status: 'In Progress',
      location: {
        lat: 30.2605,
        lng: -97.7465,
        address: 'Lady Bird Lake Hike & Bike Trail, near Shoal Creek',
        neighborhood: 'Waterfront Parks'
      },
      department: 'Parks & Urban Forestry Division',
      assignedCrew: 'Arborist Chainsaw Crew #4',
      createdAt: h(14),
      updatedAt: h(5),
      upvotes: 8,
      timeline: [
        {
          id: 'tl-80',
          status: 'Reported',
          title: 'Report Filed by Trail Runner',
          timestamp: h(14),
          actor: 'Citizen #6122'
        },
        {
          id: 'tl-81',
          status: 'Assigned',
          title: 'Assigned to Urban Forestry',
          timestamp: h(8),
          actor: 'Parks Operations'
        },
        {
          id: 'tl-82',
          status: 'In Progress',
          title: 'Chainsaw Bucking in Progress',
          timestamp: h(5),
          remark: 'Limb being cut into firewood rounds and woodchips.',
          actor: 'Foreman G. Morales'
        }
      ]
    },
    {
      id: 'iss-09',
      trackingId: 'CP-6D19P',
      title: 'Broken pedestrian crosswalk button not triggering walk signal',
      description: 'Button housing cracked open with wires exposed. Push mechanism jammed, preventing audible walk signal from activating for visually impaired citizens.',
      category: 'traffic',
      priority: 'High',
      priorityReasoning: [
        'Pedestrian safety & ADA audible signal failure',
        'Exposed wiring inside button housing'
      ],
      status: 'Verified',
      location: {
        lat: 30.2655,
        lng: -97.7420,
        address: '4th St & Congress Ave',
        neighborhood: 'Downtown'
      },
      department: 'Bureau of Traffic Management',
      createdAt: h(20),
      updatedAt: h(9),
      upvotes: 12,
      timeline: [
        {
          id: 'tl-90',
          status: 'Reported',
          title: 'Reported by Pedestrian',
          timestamp: h(20),
          actor: 'Citizen #8199'
        },
        {
          id: 'tl-91',
          status: 'Verified',
          title: 'Field Verification',
          timestamp: h(9),
          remark: 'Technician verified failed piezo sensor. New pushbutton assembly ordered from depot.',
          actor: 'Inspector T. Chen'
        }
      ]
    },
    {
      id: 'iss-10',
      trackingId: 'CP-4A88R',
      title: 'Overflowing public recycling bins blowing paper across plaza',
      description: 'Three recycling receptacles at public transit station overflowing for three days. Wind blowing beverage cups and cardboard across plaza fountain area.',
      category: 'waste',
      priority: 'Low',
      priorityReasoning: [
        'Aesthetic and litter nuisance in commercial district'
      ],
      status: 'Resolved',
      location: {
        lat: 30.2725,
        lng: -97.7405,
        address: '900 Congress Ave Plaza',
        neighborhood: 'Capitol District'
      },
      department: 'Waste Management & Sanitation',
      assignedCrew: 'Sanitation Rapid Route #5',
      createdAt: h(30),
      updatedAt: h(6),
      resolvedAt: h(6),
      upvotes: 5,
      timeline: [
        {
          id: 'tl-100',
          status: 'Reported',
          title: 'Citizen Report Filed',
          timestamp: h(30),
          actor: 'Citizen #3310'
        },
        {
          id: 'tl-101',
          status: 'Assigned',
          title: 'Added to Downtown Morning Sweep',
          timestamp: h(15),
          actor: 'Sanitation Desk'
        },
        {
          id: 'tl-102',
          status: 'Resolved',
          title: 'Emptied and Sanitized',
          timestamp: h(6),
          remark: 'Bins emptied and power-washed. Liner replaced.',
          actor: 'Sanitation Driver H. Ruiz'
        }
      ]
    },
    // Seed issue 11 to 24 providing rich density and coverage
    {
      id: 'iss-11',
      trackingId: 'CP-9W43C',
      title: 'Sunken trench patch creating 4-inch asphalt drop',
      description: 'Utility trench backfill has settled significantly after sewer line work. Cars hitting it hard at 30mph.',
      category: 'road',
      priority: 'High',
      priorityReasoning: [
        'High impact arterial road at West 6th St',
        'Vehicle suspension damage risk'
      ],
      status: 'Verified',
      location: {
        lat: 30.2702,
        lng: -97.7510,
        address: '708 W 6th St, Downtown West',
        neighborhood: 'Old West Austin'
      },
      department: 'Department of Public Works',
      createdAt: h(22),
      updatedAt: h(7),
      upvotes: 16,
      timeline: [
        { id: 'tl-110', status: 'Reported', title: 'Report Logged', timestamp: h(22), actor: 'Citizen #5012' },
        { id: 'tl-111', status: 'Verified', title: 'Site Inspection Conducted', timestamp: h(7), remark: 'Subbase settlement confirmed. Permitted contractor cited for warranty repair.', actor: 'Public Works Inspector' }
      ]
    },
    {
      id: 'iss-12',
      trackingId: 'CP-3K89V',
      title: 'Low hanging electrical service drop wire over alley',
      description: 'Overhead service conductor sagged down to approximately 7 feet above alley pavement. Delivery trucks will snag it.',
      category: 'streetlight',
      priority: 'Critical',
      priorityReasoning: [
        'Critical safety hazard: Sagging wire snag risk by commercial box trucks',
        'Potential live electrical wire exposure'
      ],
      status: 'In Progress',
      location: {
        lat: 30.2678,
        lng: -97.7390,
        address: 'Alley between E 5th & E 6th, Downtown',
        neighborhood: 'Downtown Core'
      },
      department: 'City Power & Lighting Grid',
      assignedCrew: 'High Voltage Linemen Crew #1',
      createdAt: h(5),
      updatedAt: h(1),
      upvotes: 21,
      timeline: [
        { id: 'tl-120', status: 'Reported', title: 'Emergency Citizen Alert', timestamp: h(5), actor: 'Citizen #9921' },
        { id: 'tl-121', status: 'Verified', title: 'Lineman Dispatch', timestamp: h(4), actor: 'Grid Control' },
        { id: 'tl-122', status: 'In Progress', title: 'Alley Barricaded & Re-Tensioning', timestamp: h(1), remark: 'Neutral messenger cable being re-tensioned to 15ft minimum clearance.', actor: 'Lineman Lead M. O’Connor' }
      ]
    },
    {
      id: 'iss-13',
      trackingId: 'CP-7X12T',
      title: 'Water valve box lid missing leaving open 10-inch iron hole',
      description: 'Cast iron round cover missing from water valve box right in front of restaurant entrance. Severe ankle break hazard.',
      category: 'water',
      priority: 'High',
      priorityReasoning: [
        'Open utility hole in direct pedestrian path',
        'High foot-traffic district'
      ],
      status: 'Assigned',
      location: {
        lat: 30.2649,
        lng: -97.7402,
        address: '204 E 4th St, Convention Center District',
        neighborhood: 'Downtown'
      },
      department: 'Municipal Water & Sewer Authority',
      createdAt: h(16),
      updatedAt: h(11),
      upvotes: 14,
      timeline: [
        { id: 'tl-130', status: 'Reported', title: 'Citizen Report Logged', timestamp: h(16), actor: 'Citizen #2203' },
        { id: 'tl-131', status: 'Assigned', title: 'Replacement Lid Dispatched', timestamp: h(11), remark: 'Temporary rubber cone placed; replacement cast iron cover being delivered.', actor: 'Utility Dispatch' }
      ]
    },
    {
      id: 'iss-14',
      trackingId: 'CP-5M98L',
      title: 'Graffiti tagging defacing historic park monument',
      description: 'Extensive spray paint across stone base of historic civic monument in Republic Square.',
      category: 'parks',
      priority: 'Low',
      priorityReasoning: [
        'Property vandalism, non-hazardous cosmetic issue'
      ],
      status: 'Reported',
      location: {
        lat: 30.2680,
        lng: -97.7460,
        address: 'Republic Square, 422 Guadalupe St',
        neighborhood: 'Downtown'
      },
      department: 'Parks & Urban Forestry Division',
      createdAt: h(12),
      updatedAt: h(12),
      upvotes: 4,
      timeline: [
        { id: 'tl-140', status: 'Reported', title: 'Citizen Report Filed', timestamp: h(12), actor: 'Citizen #3812' }
      ]
    },
    {
      id: 'iss-15',
      trackingId: 'CP-2H34B',
      title: 'Street drain covered by construction runoff mud and silt',
      description: 'Active construction site uphill failed to maintain silt fencing. Heavy mud deposit has choked 2 curb inlets.',
      category: 'drainage',
      priority: 'Medium',
      priorityReasoning: [
        'Environmental runoff & storm sewer siltation'
      ],
      status: 'Verified',
      location: {
        lat: 30.2625,
        lng: -97.7445,
        address: 'W Cesar Chavez St & Colorado St',
        neighborhood: 'South Downtown'
      },
      department: 'Municipal Water & Sewer Authority',
      createdAt: h(26),
      updatedAt: h(15),
      upvotes: 8,
      timeline: [
        { id: 'tl-150', status: 'Reported', title: 'Report Filed', timestamp: h(26), actor: 'Citizen #1089' },
        { id: 'tl-151', status: 'Verified', title: 'Environmental Inspection', timestamp: h(15), remark: 'Stop-work notice issued to site general contractor until BMP silt barriers are restored.', actor: 'Code Officer H. Kim' }
      ]
    },
    {
      id: 'iss-16',
      trackingId: 'CP-8V77N',
      title: 'Damaged speed limit sign bent horizontally into bike lane',
      description: 'Metal sign pole was struck by a vehicle and is now jutting out at shoulder height directly across designated protected bike lane.',
      category: 'traffic',
      priority: 'High',
      priorityReasoning: [
        'Severe collision hazard for cyclists at night',
        'Physical projection into active right of way'
      ],
      status: 'Resolved',
      location: {
        lat: 30.2660,
        lng: -97.7540,
        address: 'W 3rd St & N Lamar Blvd',
        neighborhood: 'Market District'
      },
      department: 'Bureau of Traffic Management',
      assignedCrew: 'Sign Shop Rapid Response Unit',
      createdAt: h(44),
      updatedAt: h(18),
      resolvedAt: h(18),
      upvotes: 18,
      timeline: [
        { id: 'tl-160', status: 'Reported', title: 'Reported by Cyclist', timestamp: h(44), actor: 'Citizen #9011' },
        { id: 'tl-161', status: 'Assigned', title: 'Crew Dispatched', timestamp: h(30), actor: 'Traffic Dispatch' },
        { id: 'tl-162', status: 'Resolved', title: 'Sign Pole Straightened & Secured', timestamp: h(18), remark: 'Anchor sleeve replaced; new high-intensity retroreflective sign mounted.', actor: 'Sign Tech J. Davis' }
      ]
    },
    {
      id: 'iss-17',
      trackingId: 'CP-6P45K',
      title: 'Flickering streetlamp strobing every 3 seconds',
      description: 'Sodium vapor bulb cycle failure causing rapid epileptic strobing directly outside 2nd floor residential bedroom windows.',
      category: 'streetlight',
      priority: 'Low',
      priorityReasoning: [
        'Nuisance cycling issue, non-structural'
      ],
      status: 'Reported',
      location: {
        lat: 30.2630,
        lng: -97.7360,
        address: '70 Rainey St, Apartment Complex Frontage',
        neighborhood: 'Rainey District'
      },
      department: 'City Power & Lighting Grid',
      createdAt: h(15),
      updatedAt: h(15),
      upvotes: 7,
      timeline: [
        { id: 'tl-170', status: 'Reported', title: 'Citizen Report Filed', timestamp: h(15), actor: 'Citizen #4023' }
      ]
    },
    {
      id: 'iss-18',
      trackingId: 'CP-1L23S',
      title: 'Broken curb ramp with crumbed concrete and rebar exposed',
      description: 'Wheelchair access ramp at corner curb has completely broken off. Exposed rusted steel rebar tip could puncture stroller or wheelchair tires.',
      category: 'footpath',
      priority: 'High',
      priorityReasoning: [
        'Critical accessibility barrier at pedestrian intersection',
        'Exposed rebar puncture hazard'
      ],
      status: 'In Progress',
      location: {
        lat: 30.2730,
        lng: -97.7470,
        address: '1000 San Antonio St',
        neighborhood: 'Downtown'
      },
      department: 'Department of Public Works',
      assignedCrew: 'ADA Curb Ramp Specialist Crew',
      createdAt: h(48),
      updatedAt: h(4),
      upvotes: 22,
      timeline: [
        { id: 'tl-180', status: 'Reported', title: 'Citizen Report Filed', timestamp: h(48), actor: 'Citizen #7719' },
        { id: 'tl-181', status: 'Verified', title: 'ADA Inspector Site Visit', timestamp: h(32), remark: 'Urgent priority upgrade due to transit proximity.', actor: 'Inspector S. Lee' },
        { id: 'tl-182', status: 'In Progress', title: 'Concrete Formwork Poured', timestamp: h(4), remark: 'Old fractured ramp demolished; new truncated dome detectable warning plate being set in fresh concrete.', actor: 'Foreman T. Scott' }
      ]
    },
    {
      id: 'iss-19',
      trackingId: 'CP-4J77Y',
      title: 'Fire hydrant leaking continuous steady stream into storm drain',
      description: 'Hydrant bonnet connection weeping water continuously for days. Wasting treated municipal water.',
      category: 'water',
      priority: 'Medium',
      priorityReasoning: [
        'Resource waste: Municipal water loss',
        'Slow persistent leak without immediate structural compromise'
      ],
      status: 'Verified',
      location: {
        lat: 30.2675,
        lng: -97.7320,
        address: '900 E 6th St, East Austin',
        neighborhood: 'East Austin Corridor'
      },
      department: 'Municipal Water & Sewer Authority',
      createdAt: h(38),
      updatedAt: h(20),
      upvotes: 10,
      timeline: [
        { id: 'tl-190', status: 'Reported', title: 'Citizen Report Logged', timestamp: h(38), actor: 'Citizen #1902' },
        { id: 'tl-191', status: 'Verified', title: 'Valve Inspection', timestamp: h(20), remark: 'Gasket degradation identified on side port nozzle. Replacement scheduled.', actor: 'Utility Tech B. Rogers' }
      ]
    },
    {
      id: 'iss-20',
      trackingId: 'CP-9N61Z',
      title: 'Illegal dumping of 14 discarded automobile tires',
      description: 'Stack of discarded truck and car tires dumped behind vacant warehouse lot. Mosquito breeding hazard.',
      category: 'waste',
      priority: 'Medium',
      priorityReasoning: [
        'Vector mosquito hazard and fire fuel risk'
      ],
      status: 'Assigned',
      location: {
        lat: 30.2610,
        lng: -97.7315,
        address: '1100 E 4th St, East Side',
        neighborhood: 'East Austin'
      },
      department: 'Waste Management & Sanitation',
      assignedCrew: 'Hazardous Materials & Tire Abatement Unit',
      createdAt: h(19),
      updatedAt: h(9),
      upvotes: 5,
      timeline: [
        { id: 'tl-200', status: 'Reported', title: 'Report Filed', timestamp: h(19), actor: 'Citizen #6311' },
        { id: 'tl-201', status: 'Assigned', title: 'Special Pickup Scheduled', timestamp: h(9), remark: 'Scheduled for tire recycling facility drop-off.', actor: 'Sanitation Dispatch' }
      ]
    },
    // Seed issue 21 to 30
    {
      id: 'iss-21',
      trackingId: 'CP-3R58W',
      title: 'Dead tree with large cracked branch hanging over playground',
      description: 'Large pine tree branch cracked during lightning strike, suspended 25ft directly over children swing set.',
      category: 'parks',
      priority: 'Critical',
      priorityReasoning: [
        'Critical safety hazard: Overhead drop hazard above children playground',
        'Immediate life safety risk in municipal park'
      ],
      status: 'In Progress',
      location: {
        lat: 30.2750,
        lng: -97.7515,
        address: 'Pease District Park, Parkway Playground',
        neighborhood: 'Pease Park'
      },
      department: 'Parks & Urban Forestry Division',
      assignedCrew: 'Emergency Tree Climbers Unit',
      createdAt: h(7),
      updatedAt: h(2),
      upvotes: 31,
      timeline: [
        { id: 'tl-210', status: 'Reported', title: 'Citizen Emergency Call & Photo', timestamp: h(7), actor: 'Citizen #9244' },
        { id: 'tl-211', status: 'Verified', title: 'Park Ranger Cordoned Playground', timestamp: h(5), remark: 'Yellow caution tape wrapped around swings and play structure.', actor: 'Ranger M. Sterling' },
        { id: 'tl-212', status: 'In Progress', title: 'Bucket Truck Arrived', timestamp: h(2), remark: 'Arborist in harness rigged rigging ropes to safely lower damaged branch.', actor: 'Lead Arborist C. Vance' }
      ]
    },
    {
      id: 'iss-22',
      trackingId: 'CP-7G88L',
      title: 'Street name sign knocked down and missing at busy corner',
      description: 'Vehicle collided with corner street name sign pole. Intersection is unmarked, causing delivery drivers and emergency vehicles confusion.',
      category: 'traffic',
      priority: 'Low',
      priorityReasoning: [
        'Wayfinding inconvenience, non-urgent'
      ],
      status: 'Reported',
      location: {
        lat: 30.2690,
        lng: -97.7360,
        address: 'Neches St & E 6th St',
        neighborhood: 'Historic 6th'
      },
      department: 'Bureau of Traffic Management',
      createdAt: h(11),
      updatedAt: h(11),
      upvotes: 3,
      timeline: [
        { id: 'tl-220', status: 'Reported', title: 'Citizen Report Logged', timestamp: h(11), actor: 'Citizen #4521' }
      ]
    },
    {
      id: 'iss-23',
      trackingId: 'CP-5T99Q',
      title: 'Raw sewage odor escaping from manhole rim',
      description: 'Persistent strong sulfur/sewage odor leaking around manhole cover near outdoor dining patios.',
      category: 'water',
      priority: 'High',
      priorityReasoning: [
        'Sanitation health hazard near commercial food establishments'
      ],
      status: 'Assigned',
      location: {
        lat: 30.2670,
        lng: -97.7445,
        address: 'W 4th St & Colorado St',
        neighborhood: 'Downtown Dining Corridor'
      },
      department: 'Municipal Water & Sewer Authority',
      createdAt: h(18),
      updatedAt: h(8),
      upvotes: 17,
      timeline: [
        { id: 'tl-230', status: 'Reported', title: 'Report Filed', timestamp: h(18), actor: 'Citizen #1129' },
        { id: 'tl-231', status: 'Assigned', title: 'Sewer Sniffer Unit Dispatched', timestamp: h(8), remark: 'Technicians assigned to inspect gas trap and line blockage.', actor: 'Water Authority Dispatch' }
      ]
    },
    {
      id: 'iss-24',
      trackingId: 'CP-2D84V',
      title: 'Multiple cluster potholes on high-speed frontage ramp',
      description: 'Cluster of 4 severe potholes forming on expressway off-ramp lane. Drivers braking violently.',
      category: 'road',
      priority: 'High',
      priorityReasoning: [
        'High-speed highway off-ramp hazard',
        'Cluster of multiple contiguous surface failures'
      ],
      status: 'Resolved',
      location: {
        lat: 30.2760,
        lng: -97.7320,
        address: 'I-35 Frontage Road at E 11th St',
        neighborhood: 'Central East'
      },
      department: 'Department of Public Works',
      assignedCrew: 'Highway Paving Rapid Squad #2',
      createdAt: h(56),
      updatedAt: h(12),
      resolvedAt: h(12),
      upvotes: 24,
      timeline: [
        { id: 'tl-240', status: 'Reported', title: 'Report Filed', timestamp: h(56), actor: 'Citizen #8841' },
        { id: 'tl-241', status: 'Verified', title: 'Inspected by Highway District', timestamp: h(42), actor: 'Inspector K. Miller' },
        { id: 'tl-242', status: 'In Progress', title: 'Night Shift Asphalt Crew Deployed', timestamp: h(16), actor: 'Night Dispatch' },
        { id: 'tl-243', status: 'Resolved', title: 'Repaved and Reopened', timestamp: h(12), remark: 'Complete 25-meter overlay completed with asphalt tack coat and hot mix.', actor: 'Supervisor D. Jenkins' }
      ]
    },
    {
      id: 'iss-25',
      trackingId: 'CP-8C11M',
      title: 'Broken irrigation sprinkler flooding pedestrian sidewalk',
      description: 'City park sprinkler head was sheared off, creating a 15-foot geyser of water flooding across the concrete walkway.',
      category: 'parks',
      priority: 'Medium',
      priorityReasoning: [
        'Water waste and path flooding'
      ],
      status: 'Resolved',
      location: {
        lat: 30.2618,
        lng: -97.7490,
        address: 'Vic Mathias Shores Park, Riverside Dr',
        neighborhood: 'South Shore'
      },
      department: 'Parks & Urban Forestry Division',
      createdAt: h(24),
      updatedAt: h(10),
      resolvedAt: h(10),
      upvotes: 6,
      timeline: [
        { id: 'tl-250', status: 'Reported', title: 'Report Filed', timestamp: h(24), actor: 'Citizen #2099' },
        { id: 'tl-251', status: 'Resolved', title: 'Zone Valve Shut Off & Nozzle Replaced', timestamp: h(10), remark: 'Replaced broken RainBird 1804 head and re-aligned spray angle away from walkway.', actor: 'Parks Tech F. Ramos' }
      ]
    },
    {
      id: 'iss-26',
      trackingId: 'CP-4X62N',
      title: 'Shattered glass bottle mess across neighborhood bike lane',
      description: 'Dozens of broken beer bottles scattered across bike lane outside entertainment venue for 50 yards.',
      category: 'waste',
      priority: 'Medium',
      priorityReasoning: [
        'Tire puncture hazard and pedestrian injury risk'
      ],
      status: 'Resolved',
      location: {
        lat: 30.2672,
        lng: -97.7368,
        address: 'E 6th St & Sabine St',
        neighborhood: 'Entertainment District'
      },
      department: 'Waste Management & Sanitation',
      assignedCrew: 'Downtown Mechanical Street Sweeper #2',
      createdAt: h(32),
      updatedAt: h(14),
      resolvedAt: h(14),
      upvotes: 9,
      timeline: [
        { id: 'tl-260', status: 'Reported', title: 'Report Filed', timestamp: h(32), actor: 'Citizen #1449' },
        { id: 'tl-261', status: 'Resolved', title: 'Street Sweeper Swept Lane', timestamp: h(14), remark: 'Compact regenerative-air sweeper cleaned all glass debris.', actor: 'Driver O. Martinez' }
      ]
    }
  ];
}

// In-Memory Database store with seed reset support
class IssueDatabase {
  private issues: CivicIssue[] = [];

  constructor() {
    this.resetSeed();
  }

  public resetSeed(): void {
    this.issues = createSeedIssues();
  }

  public getAll(filters?: {
    category?: string;
    status?: string;
    priority?: string;
    search?: string;
    deviceId?: string;
  }): CivicIssue[] {
    let result = [...this.issues];

    if (filters?.category && filters.category !== 'all') {
      result = result.filter(i => i.category === filters.category);
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter(i => i.status === filters.status);
    }

    if (filters?.priority && filters.priority !== 'all') {
      result = result.filter(i => i.priority === filters.priority);
    }

    if (filters?.deviceId) {
      result = result.filter(i => i.deviceId === filters.deviceId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        i =>
          i.trackingId.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.location.address.toLowerCase().includes(q) ||
          i.department.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getByTrackingId(trackingId: string): CivicIssue | undefined {
    return this.issues.find(
      i => i.trackingId.toLowerCase() === trackingId.trim().toLowerCase()
    );
  }

  public getById(id: string): CivicIssue | undefined {
    return this.issues.find(i => i.id === id);
  }

  public createIssue(data: {
    title: string;
    description: string;
    category: IssueCategory;
    location: { lat: number; lng: number; address: string; neighborhood?: string };
    photoUrl?: string;
    deviceId?: string;
    overridePriority?: IssuePriority;
  }): CivicIssue {
    const trackingId = generateTrackingId();
    const evaluation = evaluatePriority(
      data.category,
      data.description,
      data.title,
      data.location.lat,
      data.location.lng,
      this.issues
    );

    const now = new Date().toISOString();
    const department = getDepartmentForCategory(data.category);

    const newIssue: CivicIssue = {
      id: 'iss-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
      trackingId,
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      priority: data.overridePriority || evaluation.priority,
      priorityReasoning: evaluation.reasons,
      status: 'Reported',
      location: data.location,
      photoUrl: data.photoUrl,
      department,
      createdAt: now,
      updatedAt: now,
      upvotes: 1,
      deviceId: data.deviceId,
      timeline: [
        {
          id: 'tl-' + Date.now(),
          status: 'Reported',
          title: 'Citizen Report Submitted',
          timestamp: now,
          remark: `Categorized automatically under ${department}. Evaluated as ${evaluation.priority} priority.`,
          actor: 'Citizen Portal (Automated)'
        }
      ]
    };

    this.issues.unshift(newIssue);
    return newIssue;
  }

  public updateStatus(
    trackingId: string,
    newStatus: IssueStatus,
    remark?: string,
    actor?: string
  ): CivicIssue | null {
    const issue = this.getByTrackingId(trackingId);
    if (!issue) return null;

    const now = new Date().toISOString();
    issue.status = newStatus;
    issue.updatedAt = now;

    if (newStatus === 'Resolved') {
      issue.resolvedAt = now;
    }

    issue.timeline.push({
      id: 'tl-' + Date.now(),
      status: newStatus,
      title: `Status Changed to ${newStatus}`,
      timestamp: now,
      remark: remark || `Status progressed to ${newStatus} in Municipal Operations Center.`,
      actor: actor || 'Operations Dispatch'
    });

    return issue;
  }

  public updatePriority(trackingId: string, priority: IssuePriority, reason?: string): CivicIssue | null {
    const issue = this.getByTrackingId(trackingId);
    if (!issue) return null;

    issue.priority = priority;
    issue.updatedAt = new Date().toISOString();
    if (reason) {
      issue.priorityReasoning.push(`Dispatcher Override: ${reason}`);
    }
    return issue;
  }

  public assignDepartment(
    trackingId: string,
    department: string,
    crew?: string,
    remark?: string
  ): CivicIssue | null {
    const issue = this.getByTrackingId(trackingId);
    if (!issue) return null;

    const now = new Date().toISOString();
    issue.department = department;
    if (crew) issue.assignedCrew = crew;
    issue.updatedAt = now;

    if (issue.status === 'Reported' || issue.status === 'Verified') {
      issue.status = 'Assigned';
    }

    issue.timeline.push({
      id: 'tl-' + Date.now(),
      status: issue.status,
      title: `Dispatched to ${department}`,
      timestamp: now,
      remark: remark || (crew ? `Assigned to ${crew}` : `Transferred work order to ${department}`),
      actor: 'Dispatcher'
    });

    return issue;
  }

  public upvote(trackingId: string): CivicIssue | null {
    const issue = this.getByTrackingId(trackingId);
    if (!issue) return null;
    issue.upvotes = (issue.upvotes || 0) + 1;
    return issue;
  }

  public addRemark(trackingId: string, remark: string, actor?: string): CivicIssue | null {
    const issue = this.getByTrackingId(trackingId);
    if (!issue) return null;

    const now = new Date().toISOString();
    issue.updatedAt = now;
    issue.timeline.push({
      id: 'tl-' + Date.now(),
      status: issue.status,
      title: 'Official Crew Note Added',
      timestamp: now,
      remark,
      actor: actor || 'Field Crew'
    });

    return issue;
  }

  public getAnalytics(): CityAnalytics {
    const total = this.issues.length;
    const resolved = this.issues.filter(i => i.status === 'Resolved').length;
    const inProgress = this.issues.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length;
    const critical = this.issues.filter(i => i.priority === 'Critical' && i.status !== 'Resolved').length;

    const resolutionRatePercent = total > 0 ? Math.round((resolved / total) * 100) : 0;

    // Compute average resolution hours from resolved issues
    const resolvedWithTimes = this.issues.filter(i => i.status === 'Resolved' && i.resolvedAt);
    let avgResolutionHours = 8.5; // default fallback
    if (resolvedWithTimes.length > 0) {
      const totalHours = resolvedWithTimes.reduce((acc, issue) => {
        const diffMs = new Date(issue.resolvedAt!).getTime() - new Date(issue.createdAt).getTime();
        return acc + Math.max(1, diffMs / (1000 * 3600));
      }, 0);
      avgResolutionHours = Math.round((totalHours / resolvedWithTimes.length) * 10) / 10;
    }

    // Category breakdown
    const categoryMap: Record<IssueCategory, { label: string; count: number; color: string }> = {
      road: { label: 'Roads & Potholes', count: 0, color: '#38bdf8' },
      streetlight: { label: 'Lighting & Power', count: 0, color: '#facc15' },
      waste: { label: 'Waste & Sanitation', count: 0, color: '#fb923c' },
      water: { label: 'Water & Mains', count: 0, color: '#06b6d4' },
      drainage: { label: 'Drainage & Floods', count: 0, color: '#818cf8' },
      footpath: { label: 'Sidewalks & Curbs', count: 0, color: '#a78bfa' },
      traffic: { label: 'Traffic & Signals', count: 0, color: '#f43f5e' },
      parks: { label: 'Parks & Trees', count: 0, color: '#4ade80' },
      other: { label: 'Other Hazards', count: 0, color: '#94a3b8' }
    };

    for (const issue of this.issues) {
      if (categoryMap[issue.category]) {
        categoryMap[issue.category].count++;
      }
    }

    const categoryBreakdown = (Object.keys(categoryMap) as IssueCategory[]).map(cat => ({
      category: cat,
      label: categoryMap[cat].label,
      count: categoryMap[cat].count,
      color: categoryMap[cat].color
    })).filter(c => c.count > 0);

    // Status breakdown
    const statusMap: Record<IssueStatus, { count: number; color: string }> = {
      Reported: { count: 0, color: '#94a3b8' },
      Verified: { count: 0, color: '#38bdf8' },
      Assigned: { count: 0, color: '#a855f7' },
      'In Progress': { count: 0, color: '#f59e0b' },
      Resolved: { count: 0, color: '#10b981' }
    };

    for (const issue of this.issues) {
      if (statusMap[issue.status]) {
        statusMap[issue.status].count++;
      }
    }

    const statusBreakdown = (Object.keys(statusMap) as IssueStatus[]).map(st => ({
      status: st,
      count: statusMap[st].count,
      color: statusMap[st].color
    }));

    // Recent activity trend (last 7 days)
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Today'];
    const recentActivityTrend = days.map((day, idx) => {
      return {
        date: day,
        reported: Math.floor(4 + (idx * 2.5) % 8),
        resolved: Math.floor(3 + (idx * 2.1) % 7)
      };
    });

    // Department performance
    const depts = [
      'Department of Public Works',
      'Municipal Water & Sewer Authority',
      'City Power & Lighting Grid',
      'Waste Management & Sanitation',
      'Bureau of Traffic Management',
      'Parks & Urban Forestry Division'
    ];

    const departmentPerformance = depts.map(dept => {
      const deptIssues = this.issues.filter(i => i.department === dept);
      const active = deptIssues.filter(i => i.status !== 'Resolved').length;
      const res = deptIssues.filter(i => i.status === 'Resolved').length;
      return {
        department: dept.replace('Department of ', '').replace('Bureau of ', ''),
        active,
        resolved: res,
        avgHours: Math.round((5 + (active * 1.5)) * 10) / 10
      };
    });

    return {
      totalIssues: total,
      resolvedIssues: resolved,
      inProgressIssues: inProgress,
      criticalIssues: critical,
      resolutionRatePercent,
      avgResolutionHours,
      categoryBreakdown,
      statusBreakdown,
      recentActivityTrend,
      departmentPerformance
    };
  }

  public checkDuplicateForNew(category: IssueCategory, lat: number, lng: number): DuplicateCheckResult {
    return checkDuplicate(category, lat, lng, this.issues);
  }

  public evaluatePriorityForNew(category: IssueCategory, description: string, title: string, lat: number, lng: number): PriorityEvaluation {
    return evaluatePriority(category, description, title, lat, lng, this.issues);
  }
}

export const db = new IssueDatabase();
