module.exports = function(Sensor, Event) {

	Sensor.inCheck = function (key, status, cb) {

		if(key === undefined | key === "") {
			return cb('Key cannot be blank');
		}

		Sensor.findOrCreate(
			{ where: {key: key}}
			, {key: key
			, name: key + ' non configuré'
			, status: status
			, createdAt: Date.now()
			, frequency: 60}
			, function (err, instance){

			Sensor.upsert(instance, function (err, obj) {
				obj.status = status;
				obj.modifiedAt = Date.now();
				obj.checkedAt = Date.now();
				obj.save({}, function (ert, objt) {
					cb(
						null
						, objt
					);
				});
			});
		});
	};
	Sensor.observe('after save', function(ctx, next) {

		if (ctx.instance.status === 'OK') {
			console.log('passé par sensor.js');
      console.log(ctx);
		}
		next();
		/*if (sensor.status === 'OK') {
				Sensor.inCheck.emit('sensor:ok', sensor);
			}*/
	});

	Sensor.remoteMethod('inCheck',
		{
			accepts: [
				{arg: 'key', type: 'string'}
				, {arg: 'status', type: 'string'}
				],
			returns: {arg: 'sensor', type: 'object'},
			http: {path: '/inCheck'},
			description: "Update existing model instance or insert a new one if it doesn't exist"

		}
	);
};
