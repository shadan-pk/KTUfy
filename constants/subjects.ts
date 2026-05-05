export interface Subject {
  name: string;
  credit: number;
}

export interface DepartmentData {
  [semester: string]: Subject[];
}

export const DEPARTMENTS = ['CSE', 'MECH', 'EEE', 'EC', 'CIVIL', 'AI&DS'] as const;
export type Department = typeof DEPARTMENTS[number];

export const SUBJECTS_BY_DEPT: Record<Department, DepartmentData> = {
  'CSE': {
    'S1': [
      { name: 'LINEAR ALGEBRA AND CALCULUS', credit: 4 },
      { name: 'ENGINEERING PHYSICS A / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS O F CIVIL & MECHANICAL ENGINEERING/ BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S2': [
      { name: 'VECTOR CALCULUS , DIFFERENTIAL EQUATIONS AND TRANSFORMS', credit: 4 },
      { name: 'ENGINEERING PHYSICS A / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 4 },
      { name: 'BASICS O F CIVIL & MECHANICAL ENGINEERING/ BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 3 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 },
      { name: 'PROGRAMMING IN C', credit: 4 }
    ],
    'S3': [
      { name: 'DISCRETE MATHEMATICAL STRUCTURES', credit: 4 },
      { name: 'DATA STRUCTURES', credit: 4 },
      { name: 'LOGIC SYSTEM DESIGN', credit: 4 },
      { name: 'OBJECT ORIENTED PROGRAMMING USING JAVA', credit: 4 },
      { name: 'DESIGN & ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'SUSTAINABLE ENGINEERING', credit: 0 },
      { name: 'DATA STRUCTURES LAB', credit: 2 },
      { name: 'OBJECT ORIENTED PROGRAMMING LAB (IN JAVA)', credit: 2 }
    ],
    'S4': [
      { name: 'GRAPH THEORY', credit: 4 },
      { name: 'COMPUTER ORGANIZATION AND ARCHITECTURE', credit: 4 },
      { name: 'DATABASE MANAGEMENT SYSTEMS', credit: 4 },
      { name: 'OPERATING SYSTEMS', credit: 4 },
      { name: 'DESIGN & ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'CONSTITUTION OF INDIA', credit: 0 },
      { name: 'DIGITAL LAB', credit: 2 },
      { name: 'OPERATING SYSTEMS LAB', credit: 2 }
    ],
    'S5': [
      { name: 'FORMAL LANGUAGES AND AUTOMATA THEORY', credit: 4 },
      { name: 'COMPUTER NETWORKS', credit: 4 },
      { name: 'SYSTEM SOFTWARE', credit: 4 },
      { name: 'MICROPROCESSORS AND MICROCONTROLLERS', credit: 4 },
      { name: 'M A N A G E M E N T O F SOFTWARE SYSTEMS', credit: 3 },
      { name: 'DISASTER MANAGEMENT', credit: 0 },
      { name: 'SYSTEM SOFTWARE AND MICROPROCESSORS LAB', credit: 2 },
      { name: 'DATABASE MANAGEMENT SYSTEMS LAB', credit: 2 }
    ],
    'S6': [
      { name: 'COMPILER DESIGN', credit: 4 },
      { name: 'COMPUTER GRAPHICS AND IMAGE PROCESSING', credit: 4 },
      { name: 'ALGORITHM ANA LYSIS AND DESIGN', credit: 4 },
      { name: 'PROGRAM ELECTIVE I', credit: 3 },
      { name: 'INDUSTRIAL ECONOMICS & FOREIGN TRADE', credit: 3 },
      { name: 'COMPREHENSIVE COURSE WORK', credit: 1 },
      { name: 'NETWORKING LAB', credit: 2 },
      { name: 'MINIPROJECT', credit: 2 }
    ],
    'S7': [
      { name: 'ARTIFICIAL INTELLIGENCE', credit: 3 },
      { name: 'PROGRAM ELECTIVE II', credit: 3 },
      { name: 'OPEN ELECTIVE', credit: 3 },
      { name: 'I N D U S T R I A L S A F E T Y ENGINEERING', credit: 0 },
      { name: 'COMPILER LAB', credit: 2 },
      { name: 'SEMINAR', credit: 2 },
      { name: 'PROJECT PHASE I', credit: 2 }
    ],
    'S8': [
      { name: 'DISTRIBUTED COMPUTING', credit: 3 },
      { name: 'PROGRAM ELECTIVE III', credit: 3 },
      { name: 'PROGRAM ELECTIVE IV', credit: 3 },
      { name: 'PROGRAM ELECTIVE V', credit: 3 },
      { name: 'COMPREHENSIVE COURSE VIVA', credit: 1 },
      { name: 'PROJECT PHASE II', credit: 4 }
    ]
  },
  'MECH': {
    'S1': [
      { name: 'LINEAR ALGEBRA AND CALCULUS', credit: 4 },
      { name: 'ENGINEERING PHYSICS B / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS OF CIVIL & MECHANICAL ENGINEERING / BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'LIFE SKILLS', credit: 0 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S2': [
      { name: 'VECTOR CALCULUS, DIFFERENTIAL EQUATIONS AND TRANSFORMS', credit: 4 },
      { name: 'ENGINEERING PHYSICS B / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS OF CIVIL & MECHANICAL ENGINEERING / BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'PROFESSIONAL COMMUNICATION', credit: 0 },
      { name: 'PROGRAMMING IN C', credit: 4 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S3': [
      { name: 'PARTIAL DIFFERENTIAL EQUATION AND COMPLEX ANALYSIS', credit: 4 },
      { name: 'MECHANICS OF SOLIDS', credit: 4 },
      { name: 'MECHANICS OF FLUIDS', credit: 4 },
      { name: 'METALLURGY & MATERIAL SCIENCE', credit: 4 },
      { name: 'DESIGN AND ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'SUSTAINABLE ENGINEERING', credit: 0 },
      { name: 'COMPUTER AIDED MACHINE DRAWING', credit: 2 },
      { name: 'MATERIALS TESTING LAB', credit: 2 }
    ],
    'S4': [
      { name: 'PROBABILITY, STATISTICS AND NUMERICAL METHODS', credit: 4 },
      { name: 'ENGINEERING THERMODYNAMICS 3-1', credit: 4 },
      { name: 'MANUFACTURING PROCESS', credit: 4 },
      { name: 'FLUID MACHINERY', credit: 4 },
      { name: 'DESIGN AND ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'CONSTITUTION OF INDIA', credit: 0 },
      { name: 'FM & HM LAB', credit: 2 },
      { name: 'MACHINE TOOLS LAB-I', credit: 2 }
    ],
    'S5': [
      { name: 'MECHANICS OF MACHINERY', credit: 4 },
      { name: 'THERMAL ENGINEERING', credit: 4 },
      { name: 'INDUSTRIAL & SYSTEMS ENGINEERING', credit: 4 },
      { name: 'MACHINE TOOLS AND METROLOGY', credit: 4 },
      { name: 'INDUSTRIAL ECONOMICS AND FOREIGN TRADE / MANAGEMENT FOR ENGINEERS', credit: 3 },
      { name: 'DISASTER MANAGEMENT', credit: 0 },
      { name: 'MACHINE TOOLS LAB-II', credit: 2 },
      { name: 'THERMAL ENGINEERING LAB-I', credit: 2 }
    ],
    'S6': [
      { name: 'HEAT & MASS TRANSFER', credit: 4 },
      { name: 'DYNAMICS AND DESIGN OF MACHINERY', credit: 4 },
      { name: 'ADVANCED MANUFACTURING ENGINEERING', credit: 4 },
      { name: 'PROGRAM ELECTIVE I', credit: 3 },
      { name: 'INDUSTRIAL ECONOMICS AND FOREIGN TRADE / MANAGEMENT FOR ENGINEERS', credit: 3 },
      { name: 'COMPREHENSIVE COURSE WORK', credit: 1 },
      { name: 'COMPUTER AIDED DESIGN & ANALYSIS LAB', credit: 2 },
      { name: 'THERMAL ENGINEERING LAB-II', credit: 2 }
    ],
    'S7': [
      { name: 'DESIGN OF MACHINE ELEMENTS', credit: 3 },
      { name: 'PROGRAM ELECTIVE II', credit: 3 },
      { name: 'OPEN ELECTIVE', credit: 3 },
      { name: 'INDUSTRIAL SAFETY ENGINEERING', credit: 0 },
      { name: 'MECHANICAL ENGINEERING LAB', credit: 2 },
      { name: 'SEMINAR', credit: 2 },
      { name: 'PROJECT PHASE I', credit: 2 }
    ],
    'S8': [
      { name: 'MECHATRONICS', credit: 3 },
      { name: 'PROGRAM ELECTIVE III', credit: 3 },
      { name: 'PROGRAM ELECTIVE IV', credit: 3 },
      { name: 'PROGRAM ELECTIVE V', credit: 3 },
      { name: 'COMPREHENSIVE VIVA VOCE', credit: 1 },
      { name: 'PROJECT PHASE II', credit: 4 }
    ]
  },
  'EEE': {
    'S1': [
      { name: 'LINEAR ALGEBRA AND CALCULUS', credit: 4 },
      { name: 'ENGINEERING PHYSICS A / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS OF CIVIL & MECHANICAL ENGINEERING / BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'LIFE SKILLS', credit: 0 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S2': [
      { name: 'VECTOR CALCULUS, DIFFERENTIAL EQUATIONS AND TRANSFORMS', credit: 4 },
      { name: 'ENGINEERING PHYSICS A / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS OF CIVIL & MECHANICAL ENGINEERING / BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'PROFESSIONAL COMMUNICATION', credit: 0 },
      { name: 'PROGRAMMING IN C', credit: 4 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S3': [
      { name: 'PARTIAL DIFFERENTIAL EQUATION AND COMPLEX ANALYSIS', credit: 4 },
      { name: 'CIRCUITS AND NETWORKS', credit: 4 },
      { name: 'MEASUREMENTS AND INSTRUMENTATION', credit: 4 },
      { name: 'ANALOG ELECTRONICS', credit: 4 },
      { name: 'DESIGN & ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'SUSTAINABLE ENGINEERING', credit: 0 },
      { name: 'CIRCUITS AND MEASUREMENTS LAB', credit: 2 },
      { name: 'ANALOG ELECTRONICS LAB', credit: 2 }
    ],
    'S4': [
      { name: 'PROBABILITY, RANDOM PROCESSES AND NUMERICAL METHODS', credit: 4 },
      { name: 'DC MACHINES AND TRANSFORMERS', credit: 4 },
      { name: 'ELECTROMAGNETIC THEORY', credit: 4 },
      { name: 'DIGITAL ELECTRONICS', credit: 4 },
      { name: 'DESIGN & ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'CONSTITUTION OF INDIA', credit: 0 },
      { name: 'ELECTRICAL MACHINES LAB I', credit: 2 },
      { name: 'DIGITAL ELECTRONICS LAB', credit: 2 }
    ],
    'S5': [
      { name: 'POWER SYSTEMS I', credit: 4 },
      { name: 'MICROPROCESSORS AND MICROCONTROLLERS', credit: 4 },
      { name: 'SIGNALS AND SYSTEMS', credit: 4 },
      { name: 'SYNCHRONOUS AND INDUCTION MACHINES', credit: 4 },
      { name: 'INDUSTRIAL ECONOMICS & FOREIGN TRADE / MANAGEMENT FOR ENGINEERS', credit: 3 },
      { name: 'DISASTER MANAGEMENT', credit: 0 },
      { name: 'MICROPROCESSORS AND MICROCONTROLLERS LAB', credit: 2 },
      { name: 'ELECTRICAL MACHINES LAB II', credit: 2 }
    ],
    'S6': [
      { name: 'LINEAR CONTROL SYSTEMS', credit: 4 },
      { name: 'POWER SYSTEMS II', credit: 4 },
      { name: 'POWER ELECTRONICS', credit: 4 },
      { name: 'PROGRAM ELECTIVE I', credit: 3 },
      { name: 'INDUSTRIAL ECONOMICS & FOREIGN TRADE / MANAGEMENT FOR ENGINEERS', credit: 3 },
      { name: 'COMREHENSIVE COURSE WORK', credit: 1 },
      { name: 'POWER SYSTEMS LAB', credit: 2 },
      { name: 'POWER ELECTRONICS LAB', credit: 2 }
    ],
    'S7': [
      { name: 'ADVANCED CONTROL SYSTEMS', credit: 3 },
      { name: 'PROGRAM ELECTIVE II', credit: 3 },
      { name: 'OPEN ELECTIVE', credit: 3 },
      { name: 'INDUSTRIAL SAFETY ENGINEERING', credit: 0 },
      { name: 'CONTROL SYSTEMS LAB', credit: 2 },
      { name: 'SEMINAR', credit: 2 },
      { name: 'PROJECT PHASE I', credit: 2 }
    ],
    'S8': [
      { name: 'ELECTRICAL SYSTEM DESIGN AND ESTIMATION', credit: 3 },
      { name: 'PROGRAM ELECTIVE III', credit: 3 },
      { name: 'PROGRAM ELECTIVE IV', credit: 3 },
      { name: 'PROGRAM ELECTIVE V', credit: 3 },
      { name: 'COMPREHENSIVE COURSE VIVA', credit: 1 },
      { name: 'PROJECT PHASE II', credit: 4 }
    ]
  },
  'EC': {
    'S1': [
      { name: 'LINEAR ALGEBRA AND CALCULUS', credit: 4 },
      { name: 'ENGINEERING PHYSICS A / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS OF CIVIL & MECHANICAL ENGINEERING / BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'LIFE SKILLS', credit: 0 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S2': [
      { name: 'VECTOR CALCULUS, DIFFERENTIAL EQUATIONS AND TRANSFORMS', credit: 4 },
      { name: 'ENGINEERING PHYSICS A / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS OF CIVIL & MECHANICAL ENGINEERING / BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'PROFESSIONAL COMMUNICATION', credit: 0 },
      { name: 'PROGRAMMING IN C', credit: 4 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S3': [
      { name: 'PARTIAL DIFFERENTIAL EQUATION AND COMPLEX ANALYSIS', credit: 4 },
      { name: 'SOLID STATE DEVICES', credit: 4 },
      { name: 'LOGIC CIRCUIT DESIGN', credit: 4 },
      { name: 'NETWORK THEORY', credit: 4 },
      { name: 'DESIGN AND ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'SUSTAINABLE ENGINEERING', credit: 0 },
      { name: 'SCIENTIFIC COMPUTING LAB', credit: 2 },
      { name: 'LOGIC DESIGN LAB', credit: 2 }
    ],
    'S4': [
      { name: 'PROBABILITY, RANDOM PROCESS AND NUMERICAL METHODS', credit: 4 },
      { name: 'ANALOG CIRCUITS', credit: 4 },
      { name: 'SIGNALS AND SYSTEMS', credit: 4 },
      { name: 'COMPUTER ARCHITECTURE AND MICROCONTROLLERS', credit: 4 },
      { name: 'DESIGN AND ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'CONSTITUTION OF INDIA', credit: 0 },
      { name: 'ANALOG CIRCUITS AND SIMULATION LAB', credit: 2 },
      { name: 'MICROCONTROLLER LAB', credit: 2 }
    ],
    'S5': [
      { name: 'LINEAR INTEGRATED CIRCUITS', credit: 4 },
      { name: 'DIGITAL SIGNAL PROCESSING', credit: 4 },
      { name: 'ANALOG AND DIGITAL COMMUNICATION', credit: 4 },
      { name: 'CONTROL SYSTEMS', credit: 4 },
      { name: 'INDUSTRIAL ECONOMICS AND FOREIGN TRADE / MANAGEMENT FOR ENGINEERS', credit: 3 },
      { name: 'DISASTER MANAGEMENT', credit: 0 },
      { name: 'ANALOG INTEGRATED CIRCUITS AND SIMULATION LAB', credit: 2 },
      { name: 'DIGITAL SIGNAL PROCESSING LAB', credit: 2 }
    ],
    'S6': [
      { name: 'ELECTROMAGNETICS', credit: 4 },
      { name: 'VLSI CIRCUIT DESIGN', credit: 4 },
      { name: 'INFORMATION THEORY AND CODING', credit: 4 },
      { name: 'PROGRAM ELECTIVE I', credit: 3 },
      { name: 'INDUSTRIAL ECONOMICS AND FOREIGN TRADE / MANAGEMENT FOR ENGINEERS', credit: 3 },
      { name: 'COMPREHENSIVE COURSE WORK', credit: 1 },
      { name: 'COMMUNICATION LAB', credit: 2 },
      { name: 'MINIPROJECT', credit: 2 }
    ],
    'S7': [
      { name: 'MICROWAVES AND ANTENNAS', credit: 3 },
      { name: 'PROGRAM ELECTIVE II', credit: 3 },
      { name: 'OPEN ELECTIVE', credit: 3 },
      { name: 'INDUSTRIAL SAFETY ENGINEERING', credit: 0 },
      { name: 'ELECTROMAGNETICS LAB', credit: 2 },
      { name: 'SEMINAR', credit: 2 },
      { name: 'PROJECT PHASE I', credit: 2 }
    ],
    'S8': [
      { name: 'WIRELESS COMMUNICATION', credit: 3 },
      { name: 'PROGRAM ELECTIVE III', credit: 3 },
      { name: 'PROGRAM ELECTIVE IV', credit: 3 },
      { name: 'PROGRAM ELECTIVE V', credit: 3 },
      { name: 'COMPREHENSIVE VIVA VOCE', credit: 1 },
      { name: 'PROJECT PHASE II', credit: 4 }
    ]
  },
  'CIVIL': {
    'S1': [
      { name: 'LINEAR ALGEBRA AND CALCULUS', credit: 4 },
      { name: 'ENGINEERING PHYSICS B / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS O F CIVIL & MECHANICAL ENGINEERING/ BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S2': [
      { name: 'VECTOR CALCULUS , DIFFERENTIAL EQUATIONS AND TRANSFORMS', credit: 4 },
      { name: 'ENGINEERING PHYSICS B / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS O F CIVIL & MECHANICAL ENGINEERING/ BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 },
      { name: 'PROGRAMMING IN C', credit: 4 }
    ],
    'S3': [
      { name: 'PARTIAL DIFFERENTIAL EQUATION AND COMPLEX ANALYSIS', credit: 4 },
      { name: 'MECHANICS OF SOLIDS', credit: 4 },
      { name: 'FLUID MECHANICS& HYDRAULICS', credit: 4 },
      { name: 'SURVEYING & GEOMATICS', credit: 4 },
      { name: 'DESIGN & ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'SUSTAINABLE ENGINEERING', credit: 0 },
      { name: 'CIVIL ENGINEERING PLANNING &DRAFTING LAB', credit: 2 },
      { name: 'SURVEY LAB', credit: 2 }
    ],
    'S4': [
      { name: 'PROBABILITY, STATISTICS AND NUMERICAL METHODS', credit: 4 },
      { name: 'ENGINEERING GEOLOGY', credit: 4 },
      { name: 'GEOTECHNICAL ENGINEERING – I', credit: 4 },
      { name: 'TRANSPORTATION ENGINEERING', credit: 4 },
      { name: 'DESIGN & ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'CONSTITUTION OF INDIA', credit: 0 },
      { name: 'MATERIAL TESTING LAB– I', credit: 2 },
      { name: 'FLUID MECHANICS LAB', credit: 2 }
    ],
    'S5': [
      { name: 'STRUCTURAL ANALYSIS – I', credit: 4 },
      { name: 'DESIGN OF CONCRETE STRUCTURES', credit: 4 },
      { name: 'GEOTECHNICAL ENGINEERING – II', credit: 4 },
      { name: 'HYDROLOGY & WATER RESOURCES ENGINEERING', credit: 4 },
      { name: 'CONSTRUCTION TECHNOLOGY & MANAGEMENT', credit: 3 },
      { name: 'DISASTER MANAGEMENT', credit: 0 },
      { name: 'MATERIAL TESTING LAB – II', credit: 2 },
      { name: 'GEOTECHNICAL ENGINEERING LAB', credit: 2 }
    ],
    'S6': [
      { name: 'STRUCTURAL ANALYSIS – II', credit: 4 },
      { name: 'ENVIRONMENTAL ENGINEERING', credit: 4 },
      { name: 'DESIGN OF HYDRAULIC STRUCTURES', credit: 4 },
      { name: 'PROGRAM ELECTIVE I', credit: 3 },
      { name: 'INDUSTRIAL ECONOMICS & FOREIGN TRADE', credit: 3 },
      { name: 'COMREHENSIVE COURSE WORK', credit: 1 },
      { name: 'TRANSPORTATION ENGINEERING LAB', credit: 2 },
      { name: 'CIVIL ENGINEERING SOFTWARE LAB', credit: 2 }
    ],
    'S7': [
      { name: 'DESIGN OF STEEL STRUCTURES', credit: 3 },
      { name: 'PROGRAM ELECTIVE II', credit: 3 },
      { name: 'OPEN ELECTIVE', credit: 3 },
      { name: 'INDUSTRIAL SAFETY ENGINEERING', credit: 0 },
      { name: 'ENVIRONMENTAL ENGG LAB', credit: 2 },
      { name: 'SEMINAR', credit: 2 },
      { name: 'PROJECT PHASE I', credit: 2 }
    ],
    'S8': [
      { name: 'QUANTITY SURVEYING & VALUATION', credit: 3 },
      { name: 'PROGRAM ELECTIVE III', credit: 3 },
      { name: 'PROGRAM ELECTIVE IV', credit: 3 },
      { name: 'PROGRAM ELECTIVE V', credit: 3 },
      { name: 'COMPREHENSIVE VIVA VOCE', credit: 1 },
      { name: 'PROJECT PHASE II', credit: 4 }
    ]
  },
  'AI&DS': {
    'S1': [
      { name: 'LINEAR ALGEBRA AND CALCULUS', credit: 4 },
      { name: 'ENGINEERING PHYSICS A / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS OF CIVIL & MECHANICAL ENGINEERING / BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'ENGINEERING PHYSICS LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 },
      { name: 'LIFE SKILLS', credit: 0 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S2': [
      { name: 'VECTOR CALCULUS, DIFFERENTIAL EQUATIONS AND TRANSFORMS', credit: 4 },
      { name: 'ENGINEERING PHYSICS A / ENGINEERING CHEMISTRY', credit: 4 },
      { name: 'ENGINEERING MECHANICS / ENGINEERING GRAPHICS', credit: 3 },
      { name: 'BASICS OF CIVIL & MECHANICAL ENGINEERING / BASICS OF ELECTRICAL & ELECTRONICS ENGINEERING', credit: 4 },
      { name: 'PROFESSIONAL COMMUNICATION', credit: 0 },
      { name: 'PROGRAMMING IN C', credit: 4 },
      { name: 'ENGINEERING PHYSICS LAB / ENGINEERING CHEMISTRY LAB', credit: 1 },
      { name: 'CIVIL & MECHANICAL WORKSHOP / ELECTRICAL & ELECTRONICS WORKSHOP', credit: 1 }
    ],
    'S3': [
      { name: 'DISCRETE MATHEMATICAL STRUCTURES', credit: 4 },
      { name: 'DATA STRUCTURES', credit: 4 },
      { name: 'LOGIC SYSTEM DESIGN', credit: 4 },
      { name: 'OBJECT ORIENTED PROGRAMMING USING JAVA', credit: 4 },
      { name: 'DESIGN & ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'SUSTAINABLE ENGINEERING', credit: 0 },
      { name: 'DATA STRUCTURES LAB', credit: 2 },
      { name: 'OBJECT ORIENTED PROGRAMMING LAB (IN JAVA)', credit: 2 }
    ],
    'S4': [
      { name: 'PROBABILITY AND STATISTICAL MODELING', credit: 4 },
      { name: 'COMPUTER ORGANISATION AND ARCHITECTURE', credit: 4 },
      { name: 'DATABASE MANAGEMENT SYSTEMS', credit: 4 },
      { name: 'OPERATING SYSTEMS', credit: 4 },
      { name: 'DESIGN & ENGINEERING / PROFESSIONAL ETHICS', credit: 2 },
      { name: 'CONSTITUTION OF INDIA', credit: 0 },
      { name: 'PYTHON AND STATISTICAL MODELING LAB', credit: 2 },
      { name: 'OPERATING SYSTEMS LAB', credit: 2 }
    ],
    'S5': [
      { name: 'FOUNDATIONS OF DATA SCIENCE', credit: 4 },
      { name: 'COMPUTER NETWORKS', credit: 4 },
      { name: 'INTRODUCTION TO MACHINE LEARNING', credit: 4 },
      { name: 'INTRODUCTION TO ARTIFICIAL INTELLIGENCE', credit: 4 },
      { name: 'MANAGEMENTOF SOFTWARE SYSTEMS', credit: 3 },
      { name: 'DISASTER MANAGEMENT', credit: 0 },
      { name: 'AI & DATA SCIENCE LAB', credit: 2 },
      { name: 'DATABASE MANAGEMENT SYSTEMS LAB', credit: 2 }
    ],
    'S6': [
      { name: 'CONCEPTS IN BIG DATA ANALYTICS', credit: 4 },
      { name: 'ROBOTICS AND INTELLIGENT SYSTEM', credit: 4 },
      { name: 'ALGORITHM ANALYSIS AND DESIGN', credit: 4 },
      { name: 'PROGRAM ELECTIVE I', credit: 3 },
      { name: 'INDUSTRIAL ECONOMICS & FOREIGN TRADE', credit: 3 },
      { name: 'COMPREHENSIVE COURSE WORK', credit: 1 },
      { name: 'BIGDATA ANALYTICS LAB', credit: 2 },
      { name: 'MINIPROJECT', credit: 2 }
    ],
    'S7': [
      { name: 'FOUNDATIONS OF DEEP LEARNING', credit: 3 },
      { name: 'PROGRAM ELECTIVE II', credit: 3 },
      { name: 'OPEN ELECTIVE', credit: 3 },
      { name: 'INDUSTRIAL SAFETY ENGINEERING', credit: 0 },
      { name: 'DEEP LEARNING LAB', credit: 2 },
      { name: 'SEMINAR', credit: 2 },
      { name: 'PROJECT PHASE I', credit: 2 }
    ],
    'S8': [
      { name: 'BUSINESS ANALYTICS', credit: 3 },
      { name: 'PROGRAM ELECTIVE III', credit: 3 },
      { name: 'PROGRAM ELECTIVE IV', credit: 3 },
      { name: 'PROGRAM ELECTIVE V', credit: 3 },
      { name: 'COMPREHENSIVE COURSE VIVA', credit: 1 },
      { name: 'PROJECT PHASE II', credit: 4 }
    ]
  }
};
