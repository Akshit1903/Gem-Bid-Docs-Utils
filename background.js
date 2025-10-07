chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.action === "callApi") {
    chrome.storage.local.get(
      [
        "csrfToken",
        "contains",
        "keywords",
        "startDate",
        "endDate",
        "startPage",
        "endPage",
      ],
      async (r) => {
        const {
          csrfToken,
          contains,
          keywords,
          startDate,
          endDate,
          startPage,
          endPage,
        } = r;
        if (!csrfToken)
          return sendResponse({ message: "❌ Missing CSRF token" });

        async function getBidDocs(
          pageNo,
          csrfToken,
          contains,
          startDate,
          endDate
        ) {
          const myHeaders = new Headers();
          myHeaders.append(
            "Content-Type",
            "application/x-www-form-urlencoded; charset=UTF-8"
          );
          myHeaders.append(
            "Cookie",
            `GeM=1474969956.20480.0000; _ga=GA1.3.539005004.1759664116; _gid=GA1.3.1754654710.1759664116; ci_session=c1f4fdf041733452aee8f0c5fd719b6cb20ecafb; csrf_gem_cookie=${csrfToken}; TS01dc9e29=01e393167de42461675b9724923f56ac7d3ffaff0487b595b35cba31935880badc2f2a140423a01d5e7a915bb7096fc1e110c26101; _ga_MMQ7TYBESB=GS2.3.s1759682323^$o2^$g1^$t1759682364^$j19^$l0^$h0`
          );
          myHeaders.append("Origin", "https://bidplus.gem.gov.in");

          const raw = `payload={\r\n    "page": ${pageNo},\r\n    "param": {\r\n      "searchBid": "${contains}",\r\n      "searchType": "fullText"\r\n    },\r\n    "filter": {\r\n      "bidStatusType": "ongoing_bids",\r\n      "byType": "all",\r\n      "highBidValue": "",\r\n      "byEndDate": {\r\n        "from": "${startDate}",\r\n        "to": "${endDate}"\r\n      },\r\n      "sort": "Bid-End-Date-Oldest"\r\n    }\r\n  }&csrf_bd_gem_nk=${csrfToken}`;

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
          };

          const res = fetch(
            "https://bidplus.gem.gov.in/all-bids-data",
            requestOptions
          );

          const finalRes = await (await res).json();
          if (finalRes.code === 404) {
            return [];
          }
          return finalRes.response.response.docs;
        }

        try {
          let res = [];
          for (let i = startPage; i <= endPage; i++) {
            let bidDocs = await getBidDocs(
              i,
              csrfToken,
              contains,
              startDate.toString().substring(0, 10),
              endDate.toString().substring(0, 10)
            );
            const keywordList = keywords.trim().split(",");
            let rowBidDocs = bidDocs
              .map((bidDoc) => {
                let desc = bidDoc.bd_category_name[0].toLowerCase();
                let score = keywordList.reduce((resScore, curWord) => {
                  if (desc.includes(curWord.trim().toLowerCase())) {
                    resScore += 1;
                  }
                  return resScore;
                }, 0);
                return {
                  bid_no: bidDoc.b_bid_number[0],
                  score: score,
                  start_date: new Date(
                    bidDoc.final_start_date_sort[0]
                  ).toLocaleString(),
                  end_date: new Date(
                    bidDoc.final_end_date_sort[0]
                  ).toLocaleString(),
                  total_quantity: bidDoc.b_total_quantity[0],
                  download_link: `https://bidplus.gem.gov.in/showbidDocument/${bidDoc.id}`,
                  category_name: desc,
                };
              })
              .sort((a, b) => b.score - a.score);
            res = [...res, ...rowBidDocs];
          }

          sendResponse({
            message: "✅ API call successful",
            data: res,
          });
        } catch (e) {
          sendResponse({
            message:
              "❌ API call failed: " +
              startDate.toString().substring(0, 10) +
              " " +
              endDate.toString().substring(0, 10) +
              e.message,
          });
        }
      }
    );
    return true; // keep channel open for async sendResponse
  }
});
