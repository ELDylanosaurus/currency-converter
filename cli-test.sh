
FAIL=0

curl -X PUT -u banker:iLikeMoney http://localhost:8000/rate/usd/chf/0.81
curl -X PUT -u banker:iLikeMoney http://localhost:8000/rate/eur/chf/0.94
curl -X PUT -u banker:iLikeMoney http://localhost:8000/rate/chf/gbp/0.93

check() {
    expected="$1"
    url="$2"
    result=$(curl -s "$url" | awk -F: '/"result"/ { gsub(/[,}]/,"",$2); print $2 }')
    if [ "$result" = "$expected" ]; then
        echo "PASS: $url -> $result"
    else
        echo "FAIL: $url -> expected $expected, got $result"
        FAIL=1
    fi
}

check "81" "http://localhost:8000/conversion/usd/chf/100"
check "94" "http://localhost:8000/conversion/eur/chf/100"
check "106.38297872340425" "http://localhost:8000/conversion/chf/eur/100"
check "123.45679012345678" "http://localhost:8000/conversion/chf/usd/100"

if [ "$FAIL" -eq 0 ]; then
    exit 0
else
    exit 1
fi
