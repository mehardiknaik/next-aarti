'use client'
function logger(data: any) {
    fetch('http://192.168.31.125:4000/log/aarti', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ log: data })
    })
}

export default logger