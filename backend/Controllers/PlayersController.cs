using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using IplAuction.Api.Data;
using IplAuction.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace IplAuction.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PlayersController : ControllerBase
    {
        private readonly DataContext _context;

        public PlayersController(DataContext context)
        {
            _context = context;
        }

        // GET: api/players
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Player>>> GetPlayers()
        {
            var players = await _context.Players.AsNoTracking().ToListAsync();
            return Ok(players);
        }

        // GET: api/players/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Player>> GetPlayer(Guid id)
        {
            var player = await _context.Players.FindAsync(id);
            if (player == null)
            {
                return NotFound(new { message = $"Player with ID {id} not found." });
            }
            return Ok(player);
        }
    }
}
