#!/usr/bin/env node

/**
 * Test script for small label generation
 * Tests the new generateSmallLabel function for Brother QL-810W DK-1203 labels
 */

const { generateSmallLabel } = require('./backend/services/labelGenerator');
const fs = require('fs');
const path = require('path');

async function testSmallLabelGeneration() {
  console.log('🏥 Testing Small Label Generation for Brother QL-810W\n');

  const testCases = [
    {
      name: 'John Doe',
      dob: '01/15/1980',
      description: 'Standard name with normal DOB'
    },
    {
      name: 'Elizabeth Alexandra Mary Windsor',
      dob: '04/21/1926',
      description: 'Long name that should be truncated'
    },
    {
      name: 'Dr. Smith-Johnson MD',
      dob: '12/31/1975',
      description: 'Name with special characters and title'
    }
  ];

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`Test ${i + 1}: ${testCase.description}`);
    console.log(`Input: ${testCase.name} | DOB: ${testCase.dob}`);

    try {
      const pdfBuffer = await generateSmallLabel({
        patientName: testCase.name,
        dob: testCase.dob
      });

      // Save the PDF to a file for manual inspection
      const filename = `test-small-label-${i + 1}.pdf`;
      const filepath = path.join(__dirname, filename);
      
      fs.writeFileSync(filepath, pdfBuffer);
      
      console.log(`✅ Success! Generated ${pdfBuffer.length} bytes`);
      console.log(`📄 Saved as: ${filename}`);
      console.log(`📏 Label size: 0.66" x 3.4" (Brother DK-1203 compatible)`);
      console.log(`🎯 Content: Name and DOB only\n`);

    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('🏁 Testing complete!');
  console.log('\nTo use in production:');
  console.log('1. Set format: "small" in your API calls');
  console.log('2. Use Brother DK-1203 labels (0.66" x 3.4")');
  console.log('3. Example API call:');
  console.log('POST /api/generate-label');
  console.log('Body: { patientName: "John Doe", dob: "01/15/1980", format: "small" }');
}

// Run the test
testSmallLabelGeneration().catch(console.error);
