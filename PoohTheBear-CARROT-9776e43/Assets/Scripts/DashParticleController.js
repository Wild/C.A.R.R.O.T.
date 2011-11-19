var dashParticleSystem : GameObject;

function Start () {

	var playerController : ThirdPersonController = GetComponent(ThirdPersonController);
	
	// The script ensures an AudioSource component is always attached.
	
	// First, we make sure the AudioSource component is initialized correctly:
	audio.loop = false;
	audio.Stop();
	
	
	// Init the particles to not emit:
	
	var dashParticles : Component[] = dashParticleSystem.GetComponents(ParticleEmitter);

	// Once every frame  update particle emission
	while (true)
	{				
		var didDash = playerController.GetDidDash();
		// handle sound effect
		if (didDash)
		{
			if (!audio.isPlaying)
			{
				audio.Play();
			}
		}
		
		
		for (var p : ParticleEmitter in dashParticles)
		{
			p.emit = didDash;
		}
		
		if(Time.time - playerController.GetStartedDashing() > 1.0) {
			if(didDash)
			{
				playerController.SetDidDash(false);
			}
		}
					
		yield;
	}
}

@script RequireComponent(AudioSource)