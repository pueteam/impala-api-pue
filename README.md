# impala-api-pue

## Pre-requisites

- NodeJS v16
- Redis
- Cloudera JDBC driver for Impala
- PM2 for non container setups

## Installation

### NodeJS

```bash
curl -sL https://rpm.nodesource.com/setup_16.x | sudo -E bash -
sudo yum install -y nodejs
sudo yum install gcc-c++ make
```

### Redis

```bash
yum install redis
systemctl start redis
systemctl enable redis
systemctl status redis
```

