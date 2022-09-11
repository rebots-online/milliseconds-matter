// The main script for the community rpcs comparison test.
let rpcns = [];
let rpcnsBad = [];
let rpcnsBadLog = [];
createRPCList();
// Creates an array of objects from json file.
async function createRPCList() {
  var response = await fetch('rpcnshttp.json');
  var data = await response.json();
  rpcns = data;

  var response = await fetch('rpcnshttps.json');
  var data = await response.json();
  data.forEach((e) => {
    rpcns.push(e);
  });
  
};
// Main Function.
async function rpcTest(rpcns) {
  // Disables button after click to prevent multiple entries.
  const buttons = document.querySelectorAll('button');
  buttons.forEach((b) => {
      b.addEventListener('click', function(){ 
          buttons.forEach((b) => {
              b.disabled = true;
              setTimeout( function() {
                  b.disabled = false;
              }, 6000);
          });
      });
  });
  // Calls a single round of test on all rpcns. Waits till all tests are complete, and then tests again.
  // Performs the test 5 times to generate averages.
  for (let b = 0; b < 6; b++) {
    terminal.write('\r\n' + '    starting test batch ' + (b) + ' of 5');
    // Pauses loop until batch is complete.
    await Promise.all(rpcns.map(async (rpcn) => {
    await testSingle(rpcn, b);
    }));
    // If rpcn has been added to rpcnsBad array, then it's removed from further testing.
    // Bad rpcns are logged with rpcnsBadLog.
    rpcnsBad.forEach((rpcnBad) => {
    rpcnsBadLog.push(rpcnBad);
      rpcns.forEach((rpcn, i) => {
        if (rpcn === rpcnBad) {
          rpcns.splice(i, 1);
        }
      });
    });
    // Clears rpcnsBad after each run.
    rpncsBad = [];
    // // Pauses loop 1 seconds after each iteration.
    await new Promise(resolve => setTimeout(resolve, 1000));
  };
  // Single test within a batch.
  async function testSingle(rpcn, b) {
    // Returns promise when fetch succeeds or fails.
    return new Promise(async function(resolve, reject){
      // Performance.now() measures the time with higher presicision than date()/
      const t0 = performance.now()
      try {
          const response = await fetch(rpcn.address, {
            signal: AbortSignal.timeout(2000),
            method: 'POST',
            headers: {
              'mode': 'no-cors',
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify( {jsonrpc: '2.0', id: 'null', method: 'getTransactionCount'} )
          });
          r = await response.json()
          const t1 = performance.now();
            // First test is not logged.
            if (b > 0) {
              logTest((t1 - t0), rpcn, b, r.result);
              terminal.write('\r\n' + '\x1b[38;2;0;168;0m' + '    response from ' + rpcn.rpcn + ' @ ' + rpcn.address + ' took ' + Math.round((t1 - t0)) + ' milliseconds.' + '\x1b[39m');
            }
          resolve();
      } catch (error) {
          terminal.write('\r\n' + '\x1b[38;2;168;0;0m ' + '    ' + rpcn.address + ' removed from test due to ' + error + '\x1b[39m');
          // Add to rpcnsBad to be used to remove bad nodes from testing.
          rpcnsBad.push(rpcn);
          resolve();
      };
    });
  };
  // Post test actions.
  let fastestA = Number.MAX_VALUE;
  let slowestA = 0;
   // Averages 5 runs and updates averages in list.
   // Also sets slowest and fastest averages for graph.
   rpcns.forEach((rpcn) => {
    let a = 0;
    for (let b = 1; b < 6; b++) {
      const batch = 'resT' + b;
      a += parseFloat(rpcn[batch]);
    }
    a /= 5;
    rpcn.resA = a.toFixed(1);
    // Sets slowest average.
    if (rpcn.resA > parseFloat(slowestA)) {
      slowestA = rpcn.resA;
    }
    // Sets fastest average.
    if (rpcn.resA < parseFloat(fastestA)) {
      fastestA = rpcn.resA;
    }
  });
  // // Removes slowest duplicate if rpcn had both http and https tested.
  // var rpcnsClean = rpcns.filter((rpcn, index, self) =>
  //   index === self.findIndex((t) => (t.rpcn === rpcns.rpcn)))
  // Sorts list by averages.
  rpcnsClean.sort((a, b) => a.resA - b.resA);
  rpcnsClean.forEach((rpcn) => {
    terminal.write('\r\n' + '    average response from ' + rpcn.address + ' took ' + rpcn.resA + ' milliseconds.');
  });
    rpcnsClean.slice(0, 9).forEach((rpcn, p) => {
    // Adds to table a header cell for position.
    generateTableHeader(p);
    // Adds a cell for org name and test result.
    generateTableCellPairs(rpcn);
  });
  // Updates slowest and fastest average scores in to best/worst table.
  updateSlowestFastestGraph(slowestA, fastestA);
  terminal.write('\r\n' + '\r\n' + '    run test with console logs open for more details')
  terminal.write('\r\n' + '\r\n' + '    home    rpc-test-start    rpc-test-about    waf-test' + '\r\n' + '\r\n');
  toggleKeyboard();
  console.log('The following rpcns were tested: ');
  console.log(rpcnsClean);
  console.log('The following rpcns failed testing: ');
  console.log(rpcnsBad);
}
// Updates object after each test within a batch.
function logTest(r, rpcn, b, c) {
  // Updates rpcn objects with results of tests.
  const batch = 'resT' + b;
  rpcn.NewField = 'batch';
  r = r.toFixed(1);
  rpcn[batch] = r;
  // console.log(c)
  // Updates solana-transaction-count and colorizes/fromats each power of a thousand for readiblity.
  if (c !== undefined ) {
    // Clears previous entry.
    document.getElementById('solana-transaction-count').innerHTML = '';
    let arrayOfP = [];
    while (c > 0) {
      let n = (c % 1000);
      // Adds leading comman and leading zeros if required.
      let s = '  ' + n.toString().padStart(3, '0');
      arrayOfP.push(s);
      c = Math.round(c / 1000);
    }
    // Removes extraneous leading chars from leading period.
    arrayOfP[arrayOfP.length - 1] = arrayOfP[arrayOfP.length - 1].replace('  ', '');
    arrayOfP[arrayOfP.length - 1] = arrayOfP[arrayOfP.length - 1].replace(/^0+/, '');
    arrayOfP.reverse().forEach(p => {
      var newSpan = document.createElement('span');
      newSpan.innerText = p;
      var randomColor = Math.floor(Math.random()*16777215).toString(16);
      newSpan.style.color = '#' + randomColor;
      document.getElementById('solana-transaction-count').appendChild(newSpan);
    });
  }
}
// Generates a header cell for each org tested along with a number indicating it's position.
function generateTableHeader(p) {
  myBody = document.getElementsByTagName('body')[0];
  myTable = myBody.getElementsByTagName('table')[1];
  myHeader = myTable.getElementsByTagName('thead')[0];
  myRow = myHeader.getElementsByTagName('tr')[0];
  var th = document.createElement('th');
  th.appendChild(document.createTextNode(p + 1));
  myRow.appendChild(th)
}
function generateTableCellPairs(rpcn) {
  myBody = document.getElementsByTagName('body')[0];
  myTableBody = myBody.getElementsByTagName('table')[1];
  myCell = myTableBody.getElementsByTagName('tr')[1];
  var td = document.createElement('td');
  td.appendChild(document.createTextNode(rpcn.rpcn));
  myCell.appendChild(td)
  myCell = myTableBody.getElementsByTagName('tr')[2];
  var td = document.createElement('td');
  td.appendChild(document.createTextNode(rpcn.resA + 'ms average'));
  myCell.appendChild(td)
}
// Updates top table with slowest and fastest and graph.
function updateSlowestFastestGraph(slowestA, fastestA) {
  myBody = document.getElementsByTagName('body')[0];
  myTableBody = myBody.getElementsByTagName('table')[0];
  myRow = myTableBody.getElementsByTagName('tr')[1];
  // Updates slowest org.
  myCell = myRow.getElementsByTagName('td')[2];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += slowestA + 'ms';
  // Updates fastest org
  myCell = myRow.getElementsByTagName('td')[0];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += fastestA + 'ms';
  // Updates graph text.
  d = (slowestA - fastestA).toFixed(1);
  myRow = myTableBody.getElementsByTagName('tr')[1];
  myCell = myRow.getElementsByTagName('td')[1];
  while(myCell.firstChild) {
    myCell.removeChild(myCell.firstChild);
  }
  myCell.textContent += (d + 'ms delta');
  // Doing some tricks to make the graph look good.
  p = Math.round(((slowestA - fastestA) / fastestA) * 100);
  // Sets graph.
  myRow = myTableBody.getElementsByTagName('tr')[0];
  myCell = myRow.getElementsByTagName('th')[1];
  myDiv = myCell.querySelector('div');
  // Removes previous test's graph.
  while(myDiv.firstChild) {
    myDiv.removeChild(myDiv.firstChild);
  }
  myDiv.classList.add('tui-chart-value', 'yellowgreen-168', 'rpc-table-chart');
  myDiv.insertAdjacentText('beforeend', p + '% faster');
  if (p > 100) {
    myDiv.style.width = 100 + '%';

  } else {
    myDiv.style.width = p + '%';
  }
  myDiv.style.color = 'white';
} 
function rpcTestAbout() {
  fetch('terminalTextRpc.txt')
    .then(response => response.text())
    .then((text) => {
        for(i = 0; i < text.length; i++) {
            (function(i){
                setTimeout(function() {
                    terminal.write(text[i]);
                    if ((text.length - 1) == (i)) { 
                        toggleKeyboard();
                    };
                }, 1 * i);
            }(i));
            } 
    })
}