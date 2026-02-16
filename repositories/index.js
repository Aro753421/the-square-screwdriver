const driver = process.env.REPOSITORY_DRIVER || 'postgres';

const repositories = {
  postgres: require('./postgresRepository'),
  json: require('./jsonRepository')
};

module.exports = repositories[driver] || repositories.postgres;
